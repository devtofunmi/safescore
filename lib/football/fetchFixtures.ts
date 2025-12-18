import axios from 'axios';
import { cache, CACHE_DURATIONS } from '../cache';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

// Map league names to football-data.org competition codes (free tier only)
export const leagueMap: { [key: string]: string } = {
  'Premier League': 'PL',
  'Championship': 'ELC',
  'Bundesliga': 'BL1',
  'La Liga': 'PD',
  'Ligue 1': 'FL1',
  'Serie A': 'SA',
  'Serie B': 'SA2',
  'Eredivisie': 'DED',
  'Primeira Liga': 'PPL',
  'Super Lig': 'TR1',
  'Greek Super League': 'GR1',
  'Allsvenskan': 'SV1',
  'Champions League': 'CL',
  'Europa League': 'EL',
};

export type APIFixture = {
  teams: { home: { name: string; id: number }; away: { name: string; id: number } };
  league?: { name: string; code: string } | null;
  utcDate: string;
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch fixtures for given leagues and date range
 * Uses caching to reduce API calls
 */
export async function fetchFixtures(
  leagues: string[],
  day: string
): Promise<APIFixture[]> {
  try {
    const leagueCodes = leagues
      .map((l) => leagueMap[l])
      .filter(Boolean) as string[];

    if (leagueCodes.length === 0) {
      console.warn('No valid league codes found for leagues:', leagues);
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

    // Create cache key
    const cacheKey = `fixtures:${leagueCodes.join(',')}-${dateFrom}-${dateTo}`;

    // Check cache first
    const cached = cache.get<APIFixture[]>(cacheKey, CACHE_DURATIONS.FIXTURES);
    if (cached) {
      console.info(`Cache hit for fixtures: ${cacheKey}`);
      return cached;
    }

    console.info('Fetching fixtures for leagues:', {
      leagueCodes,
      dateFrom,
      dateTo,
      day,
    });

    // Fetch fixtures from each league sequentially with rate limiting and retry
    const allFixtures: APIFixture[] = [];
    const delayMs = 6500; // 10 calls/minute = 6000ms per call. Using 6.5s for safety.

    for (let i = 0; i < leagueCodes.length; i++) {
      const leagueCode = leagueCodes[i];

      // Add delay before each request (except the first)
      if (i > 0) {
        await sleep(delayMs);
      }

      let retries = 0;
      let success = false;

      while (retries < 3 && !success) {
        try {
          console.info(
            `Fetching ${leagueCode}${retries > 0 ? ` (attempt ${retries + 1}/3)` : ''}`
          );

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
              timeout: 15000, // Increased from 5s to 15s
            }
          );

          const matches = response.data?.matches || [];
          console.info(`Fetched ${matches.length} matches for ${leagueCode}`);

          allFixtures.push(
            ...matches.map(
              (m: {
                homeTeam?: { name?: string; id?: number };
                awayTeam?: { name?: string; id?: number };
                utcDate?: string;
                competition?: { name?: string };
              }) => ({
                teams: {
                  home: { name: m.homeTeam?.name || 'Unknown', id: m.homeTeam?.id || 0 },
                  away: { name: m.awayTeam?.name || 'Unknown', id: m.awayTeam?.id || 0 },
                },
                league: { name: m.competition?.name || leagueCode, code: leagueCode },
                utcDate: m.utcDate || new Date().toISOString(),
              })
            )
          );

          success = true;
        } catch (err) {
          retries++;
          if (retries < 3) {
            const waitTime = 2000 * retries; // 2s, then 4s
            console.warn(
              `Error fetching ${leagueCode}: ${err instanceof Error ? err.message : String(err)}. Retrying in ${waitTime}ms...`
            );
            await sleep(waitTime);
          } else {
            console.warn(
              `Error fetching ${leagueCode}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }
      }
    }

    if (allFixtures.length === 0) {
      console.warn('No fixtures found for the given leagues and date range');
    }

    // Cache the results
    cache.set(cacheKey, allFixtures);

    return allFixtures;
  } catch (err) {
    console.error(
      'Error in fetchFixtures:',
      err instanceof Error ? err.message : String(err)
    );
    return [];
  }
}
