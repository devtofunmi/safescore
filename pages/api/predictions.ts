import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Prediction returned to the client
interface Prediction {
  id: string;
  team1: string;
  team2: string;
  betType: string;
  confidence: number; // 0-100
  odds: number;
  league: string;
  matchTime: string;
}

type PredictionsResponse = {
  predictions: Prediction[];
  timestamp: string;
  riskLevel: string;
};

// Read API keys from environment
const FOOTBALL_DATA_API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Map league names to football-data.org competition codes
const leagueMap: { [key: string]: string } = {
  'Premier League': 'PL',
  'La Liga': 'PD',
  'Bundesliga': 'BL1',
  'Serie A': 'SA',
  'Ligue 1': 'FL1',
  'Champions League': 'CL',
  'Europa League': 'EL',
};

// Minimal typed shape for fixtures we consume
type APIFixture = {
  teams: { home: { name: string }; away: { name: string } };
  league?: { name: string } | null;
  [key: string]: unknown;
};

// Shape we expect from Gemini JSON
type GeminiPredictionRaw = {
  team1: string;
  team2: string;
  betType: string;
  confidence: number;
  league?: string;
  reason?: string;
};

function parseOddsRange(range: string | undefined) {
  const defaultRange = [1.1, 1.4];
  if (!range || typeof range !== 'string') return defaultRange;
  const m = range.match(/([0-9]*\.?[0-9]+)\s*-\s*([0-9]*\.?[0-9]+)/);
  if (!m) return defaultRange;
  const a = parseFloat(m[1]);
  const b = parseFloat(m[2]);
  if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b >= a) return [a, b];
  return defaultRange;
}

async function fetchFixtures(leagues: string[], day: string): Promise<APIFixture[]> {
  try {
    const leagueCodes = leagues.map((l) => leagueMap[l]).filter(Boolean) as string[];
    if (leagueCodes.length === 0) {
      console.error('No league codes found for leagues:', leagues);
      return [];
    }

    const today = new Date();
    const dateFrom = today.toISOString().split('T')[0];
    const dateTo =
      day === 'today'
        ? dateFrom
        : day === 'tomorrow'
        ? new Date(today.getTime() + 86400000).toISOString().split('T')[0]
        : new Date(today.getTime() + 5 * 86400000).toISOString().split('T')[0];

    console.debug('fetchFixtures params:', {
      leagueCodes,
      dateFrom,
      dateTo,
      day,
      apiKeyPresent: !!FOOTBALL_DATA_API_KEY,
    });

    // Fetch fixtures from each league separately (football-data.org requires per-league calls)
    const allFixtures: APIFixture[] = [];
    for (const leagueCode of leagueCodes) {
      try {
        const response = await axios.get(
          `https://api.football-data.org/v4/competitions/${leagueCode}/matches`,
          {
            params: {
              status: 'SCHEDULED',
              dateFrom,
              dateTo,
            },
            headers: {
              'X-Auth-Token': FOOTBALL_DATA_API_KEY,
            },
          }
        );

        console.debug(`football-data.org ${leagueCode} response status:`, response.status);
        const matches = response.data?.matches || [];
        console.debug(`football-data.org ${leagueCode} matches count:`, matches.length);
        allFixtures.push(
          ...matches.map((m: { homeTeam?: { name?: string }; awayTeam?: { name?: string } }) => ({
            teams: {
              home: { name: m.homeTeam?.name || 'Unknown' },
              away: { name: m.awayTeam?.name || 'Unknown' },
            },
            league: { name: leagueCode },
          }))
        );
      } catch (leagueErr) {
        console.warn(`Error fetching ${leagueCode}:`, leagueErr instanceof Error ? leagueErr.message : leagueErr);
      }
    }

    if (allFixtures.length === 0) {
      console.warn('football-data.org returned empty fixtures array for params:', {
        leagueCodes,
        dateFrom,
        dateTo,
      });
    }

    return allFixtures;
  } catch (err) {
    const axiosErr = err instanceof Error ? err : new Error(String(err));
    const responseData = (err as { response?: { data?: unknown; status?: number } } | undefined)?.response;
    console.error('Error fetching fixtures:', {
      message: axiosErr.message,
      status: responseData?.status,
      apiResponse: responseData?.data,
      leagues,
      day,
      apiKeyPresent: !!FOOTBALL_DATA_API_KEY,
      apiKeyFormat: FOOTBALL_DATA_API_KEY
        ? `${FOOTBALL_DATA_API_KEY.substring(0, 5)}...${FOOTBALL_DATA_API_KEY.substring(FOOTBALL_DATA_API_KEY.length - 5)}`
        : 'missing',
    });
    return [];
  }
}

async function analyzeWithGemini(
  fixtureData: APIFixture[],
  oddsType: string,
  oddsRange: string,
  requestedDate: string
): Promise<Prediction[]> {
  // Batch fixtures to avoid large prompt sizes and request the model to produce
  // one prediction per match. If the model can't produce a pick for a match,
  // it should return an object with `betType: null` and `confidence: 0`.
  const chunkSize = 20;
  const chunks: APIFixture[][] = [];
  for (let i = 0; i < fixtureData.length; i += chunkSize) {
    chunks.push(fixtureData.slice(i, i + chunkSize));
  }

  const aggregated: Prediction[] = [];
  const [minOdds, maxOdds] = parseOddsRange(oddsRange);

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const startIdx = chunkIndex * chunkSize;
    const chunk = chunks[chunkIndex];

    try {
      const fixturesSnippet = JSON.stringify(
        chunk.map((m, idx) => ({
          idx: startIdx + idx,
          home: m.teams.home.name,
          away: m.teams.away.name,
          league: m.league?.name || null,
        }))
      );

      const prompt = `You are an expert sports analyst providing betting picks.
Analyze the following matches and provide a prediction for each one. The user's requested risk level is "${oddsType}" with odds between ${oddsRange} for matches on ${requestedDate}.
For each match, return a JSON object in a JSON array. Each object must include: { "idx": number, "team1": string, "team2": string, "betType": string, "confidence": number, "league": string, "reason": string }.

Provide descriptive bet types that are easy to understand. Here are some examples of bet types to use:
- "Home Team to Win or Draw"
- "Away Team to Win or Draw"
- "Home Team to Win"
- "Away Team to Win"
- "Draw"
- "Over 0.5 Goals"
- "Over 1.5 Goals"
- "Over 2.5 Goals"
- "Under 2.5 Goals"
- "Under 3.5 Goals"
- "Both Teams to Score: Yes"
- "Both Teams to Score: No"
- "Highest Scoring Half: 1st"
- "Highest Scoring Half: 2nd"
- "Handicap (-1.5) Home Team"
- "Handicap (+1.5) Away Team"
- "Home Team to Score in 1st Half: Yes"
- "Away Team to Score in 2nd Half: Yes"
- "Team to Score: Home"
- "Team to Score: Away"

Do not use ambiguous terms like "1X" or "X2". Use the full descriptive text.

Focus on providing predictions that have a high likelihood of being correct, reflected by a good confidence score. ALWAYS provide a "betType". If confidence is very low, you may indicate it in the "confidence" and "reason" fields, but still provide a plausible betType.

Return ONLY the JSON array (no explanatory text).
Matches: ${fixturesSnippet}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const body = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      };

      console.debug('Calling Gemini API with URL:', url.replace(GEMINI_API_KEY || '', '***'));
      const response = await axios.post(url, body);

      try {
        console.debug('gemini keys:', Object.keys(response.data || {}));
        console.debug('gemini candidate snippet:', JSON.stringify(response.data?.candidates?.[0]?.content?.parts?.[0] || {}));
      } catch (e) {
        console.debug('gemini logging failed', e);
      }

      const content = String(response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '');
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in Gemini response for chunk', chunkIndex);
        // Fallback: push neutral/no-pick for each match in chunk
        for (let i = 0; i < chunk.length; i++) {
          aggregated.push({
            id: `pred-${Date.now()}-${startIdx + i}`,
            team1: chunk[i].teams.home.name,
            team2: chunk[i].teams.away.name,
            betType: 'No Pick',
            confidence: 0,
            odds: parseFloat(((minOdds + maxOdds) / 2).toFixed(2)),
            league: chunk[i].league?.name || 'Unknown',
            matchTime: 'TBD',
          });
        }
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.warn('Failed to parse Gemini JSON for chunk', chunkIndex, e);
        for (let i = 0; i < chunk.length; i++) {
          aggregated.push({
            id: `pred-${Date.now()}-${startIdx + i}`,
            team1: chunk[i].teams.home.name,
            team2: chunk[i].teams.away.name,
            betType: 'No Pick',
            confidence: 0,
            odds: parseFloat(((minOdds + maxOdds) / 2).toFixed(2)),
            league: chunk[i].league?.name || 'Unknown',
            matchTime: 'TBD',
          });
        }
        continue;
      }

      if (!Array.isArray(parsed)) {
        console.warn('Gemini returned non-array for chunk', chunkIndex);
        continue;
      }

      const raw = parsed as Array<Partial<GeminiPredictionRaw & { idx?: number; team1?: string | null; team2?: string | null; betType?: string | null }>>;

      // Map parsed results back to fixtures using idx
      raw.forEach((p) => {
        const idx = typeof p.idx === 'number' ? p.idx : undefined;
        const i = typeof idx === 'number' ? idx - startIdx : undefined;
        const source = typeof i === 'number' && i >= 0 && i < chunk.length ? chunk[i] : undefined;
        const team1 = p.team1 ?? (source ? source.teams.home.name : 'Unknown');
        const team2 = p.team2 ?? (source ? source.teams.away.name : 'Unknown');
        const conf = typeof p.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(p.confidence))) : 0;
        const odds = parseFloat(((minOdds + maxOdds) / 2).toFixed(2));

        aggregated.push({
          id: `pred-${Date.now()}-${idx ?? aggregated.length}`,
          team1,
          team2,
          betType: p.betType ?? 'No Pick',
          confidence: conf,
          odds,
          league: p.league || (source ? source.league?.name || 'Unknown' : 'Unknown'),
          matchTime: 'TBD',
        });
      });
    } catch (err) {
      console.error('Error calling Gemini for chunk', chunkIndex, err instanceof Error ? err.message : err);
      // on failure push no-pick placeholders for this chunk
      for (let i = 0; i < chunk.length; i++) {
        aggregated.push({
          id: `pred-${Date.now()}-${startIdx + i}`,
          team1: chunk[i].teams.home.name,
          team2: chunk[i].teams.away.name,
          betType: 'No Pick',
          confidence: 0,
          odds: parseFloat(((minOdds + maxOdds) / 2).toFixed(2)),
          league: chunk[i].league?.name || 'Unknown',
          matchTime: 'TBD',
        });
      }
    }
  }

  return aggregated;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PredictionsResponse | { error: string }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    return;
  }

  const { oddsType, leagues, day, oddsRange, date } = req.body as {
    oddsType?: string;
    leagues?: string[];
    day?: string;
    oddsRange?: string;
    date?: string;
  };

  if (!oddsType || !leagues || !Array.isArray(leagues) || leagues.length === 0) {
    res.status(400).json({ error: 'Missing required parameters: oddsType, leagues (array)' });
    return;
  }

  let requestedDate = date || '';
  if (!requestedDate) {
    const today = new Date();
    const target =
      day === 'today'
        ? today
        : day === 'tomorrow'
        ? new Date(today.getTime() + 86400000)
        : new Date(today.getTime() + 5 * 86400000);
    requestedDate = target.toISOString().split('T')[0];
  }

  const usedOddsRange = typeof oddsRange === 'string' && oddsRange.trim() ? oddsRange : '1.10-1.40';

  try {
    if (!FOOTBALL_DATA_API_KEY || !GEMINI_API_KEY) {
      console.error('Missing API keys:', { FOOTBALL_DATA_API_KEY: !!FOOTBALL_DATA_API_KEY, GEMINI_API_KEY: !!GEMINI_API_KEY });
      res.status(500).json({ error: 'Server misconfiguration: set NEXT_PUBLIC_FOOTBALL_DATA_API_KEY and NEXT_PUBLIC_GEMINI_API_KEY' });
      return;
    }

    console.debug('Fetching fixtures for leagues:', leagues, 'day:', day);
    const fixtures = await fetchFixtures(leagues, day || 'today');
    console.debug('Fixtures fetched count:', fixtures.length);

    if (!fixtures || fixtures.length === 0) {
      console.warn('No fixtures returned from api-football');
      res.status(404).json({ error: 'No fixtures found for the selected leagues and date.' });
      return;
    }

    console.debug('Calling analyzeWithGemini with', fixtures.length, 'fixtures');
    const predictions = await analyzeWithGemini(fixtures, oddsType, usedOddsRange, requestedDate);
    console.debug('Predictions returned count:', predictions.length);

    if (!predictions || predictions.length === 0) {
      console.error('Gemini returned no usable predictions.');
      res.status(500).json({ error: 'AI did not return valid predictions. Please try again later.' });
      return;
    }

    console.debug('Successfully returning', predictions.length, 'predictions');
    res.status(200).json({ predictions, timestamp: new Date().toISOString(), riskLevel: oddsType });
  } catch (err) {
    console.error('Error generating predictions:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Failed to generate predictions. Please check your API keys and try again.' });
  }
}

