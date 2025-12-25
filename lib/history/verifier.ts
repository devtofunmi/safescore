import axios from 'axios';
import { HistoryItem } from './storage';

/**
 * Football Data API match structure for type safety.
 */
interface FootballDataMatch {
    id: number;
    utcDate: string;
    status: string;
    score: {
        winner: string | null;
        duration: string;
        fullTime: { home: number | null; away: number | null };
        halfTime: { home: number | null; away: number | null };
    };
    homeTeam: { id: number; name: string };
    awayTeam: { id: number; name: string };
    competition?: { id: number; name: string };
}

/**
 * Formats a raw score object into a human-readable string.
 */
function formatScore(match: FootballDataMatch): string {
    const { home, away } = match.score.fullTime;
    if (home === null || away === null) return '-';
    return `${home} - ${away}`;
}

/**
 * Extracts a match ID from the prediction's ID string.
 * This is used for "ID Extraction" when an explicit matchId column is missing.
 * Format: pred-{MATCH_ID}-{TIMESTAMP}-{INDEX}
 */
export function extractMatchId(id: string): number | null {
    if (!id || typeof id !== 'string') return null;
    const parts = id.split('-');
    if (parts.length >= 2) {
        const potentialId = parseInt(parts[1], 10);
        return isNaN(potentialId) ? null : potentialId;
    }
    return null;
}

/**
 * verifyPrediction
 * 
 * The core mathematical engine that compares a prediction against result data.
 * Handles diverse markets like 1X2, Over/Under, BTTS, and Half-time specific bets.
 * 
 * Note: Contributors adding new bet types should add cases here.
 */
function verifyPrediction(
    prediction: string,
    homeGoals: number,
    awayGoals: number,
    homeHT: number | null = null,
    awayHT: number | null = null
): 'Won' | 'Lost' | 'Pending' {
    const totalGoals = homeGoals + awayGoals;

    // Result of the 2nd half alone
    const hasHT = homeHT !== null && awayHT !== null;
    const home2H = hasHT ? (homeGoals - (homeHT || 0)) : 0;
    const away2H = hasHT ? (awayGoals - (awayHT || 0)) : 0;

    const goals1H = (homeHT || 0) + (awayHT || 0);
    const goals2H = home2H + away2H;

    switch (prediction) {
        // --- 1X2 Outcomes ---
        case 'Home Team to Win': return homeGoals > awayGoals ? 'Won' : 'Lost';
        case 'Away Team to Win': return awayGoals > homeGoals ? 'Won' : 'Lost';
        case 'Draw': return homeGoals === awayGoals ? 'Won' : 'Lost';

        // --- Double Chance ---
        case 'Home Team to Win or Draw': return homeGoals >= awayGoals ? 'Won' : 'Lost';
        case 'Away Team to Win or Draw': return awayGoals >= homeGoals ? 'Won' : 'Lost';

        // --- Goal Totals (Full Time) ---
        case 'Over 0.5 Goals': return totalGoals > 0.5 ? 'Won' : 'Lost';
        case 'Over 1.5 Goals': return totalGoals > 1.5 ? 'Won' : 'Lost';
        case 'Over 2.5 Goals': return totalGoals > 2.5 ? 'Won' : 'Lost';
        case 'Under 1.5 Goals': return totalGoals < 1.5 ? 'Won' : 'Lost';
        case 'Under 2.5 Goals': return totalGoals < 2.5 ? 'Won' : 'Lost';
        case 'Under 3.5 Goals': return totalGoals < 3.5 ? 'Won' : 'Lost';

        // --- Both Teams to Score ---
        case 'Both Teams to Score: Yes': return (homeGoals > 0 && awayGoals > 0) ? 'Won' : 'Lost';
        case 'Both Teams to Score: No': return (homeGoals === 0 || awayGoals === 0) ? 'Won' : 'Lost';

        // --- Team Specific ---
        case 'Team to Score: Home': return homeGoals > 0 ? 'Won' : 'Lost';
        case 'Team to Score: Away': return awayGoals > 0 ? 'Won' : 'Lost';

        // --- Custom Markets & Halves ---
        case 'Highest Scoring Half: 1st':
            if (!hasHT) return 'Pending';
            return goals1H > goals2H ? 'Won' : 'Lost';

        case 'Highest Scoring Half: 2nd':
            if (!hasHT) return 'Pending';
            return goals2H > goals1H ? 'Won' : 'Lost';

        case 'Home Team to Score in 1st Half: Yes':
            if (!hasHT) return 'Pending';
            return (homeHT || 0) > 0 ? 'Won' : 'Lost';

        case 'Away Team to Score in 2nd Half: Yes':
            if (!hasHT) return 'Pending';
            return away2H > 0 ? 'Won' : 'Lost';

        // --- Handicap Markets ---
        case 'Handicap (-1.5) Home Team': return (homeGoals - 1.5) > awayGoals ? 'Won' : 'Lost';
        case 'Handicap (+1.5) Away Team': return (awayGoals + 1.5) > homeGoals ? 'Won' : 'Lost';

        default: return 'Lost';
    }
}

/**
 * findMatchByTeams
 * 
 * Fallback "Healer" logic. If a match ID is missing, searches the API for a match 
 * between the two teams on or near the predicted date.
 */
async function findMatchByTeams(
    homeTeam: string,
    awayTeam: string,
    predictionDate: string | undefined, // The date we predicted the match for
    apiKey: string
): Promise<number | null> {
    if (!predictionDate) return null;

    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const matchDate = new Date(predictionDate);

        // Search from 3 days before predicted date up to today
        const dateFrom = new Date(matchDate);
        dateFrom.setDate(matchDate.getDate() - 3);

        const fromStr = dateFrom.toISOString().split('T')[0];
        const toStr = todayStr; // Always search up to today to catch rescheduled matches

        const response = await axios.get(`https://api.football-data.org/v4/matches`, {
            headers: { 'X-Auth-Token': apiKey },
            params: { dateFrom: fromStr, dateTo: toStr }
        });

        const matches = response.data.matches as FootballDataMatch[];
        const totalFound = matches?.length || 0;

        // DEBUG: Output all fixtures in the range for deep diagnostics
        if (totalFound > 0) {
            const pool = matches.map(m => `${m.id}:${m.homeTeam.name} vs ${m.awayTeam.name}`).join(' | ');
            console.info(`[Verifier] Searching ${homeTeam} vs ${awayTeam} in range ${fromStr} to ${toStr}. Pool (${totalFound} matches): ${pool}`);
        }

        const normalize = (n: string) => n.toLowerCase()
            .replace(/\b(fc|afc|cf|sc|ac|united|city|rovers|albion|town|athletic|clube de|club|de|as|ss|ssc|bc|uc|us|cd|cuba|futebol|sad|sports|sporting|international|internazionale|italy|portugal|spain|france|england|germany)\b/g, '')
            .replace(/[\W_]+/g, ' ')
            .trim();

        // Technical Mappings
        const nicknames: Record<string, string[]> = {
            'wolves': ['wolverhampton'],
            'inter': ['internazionale'],
            'mancity': ['manchester city'],
            'manutd': ['manchester united'],
            'avs': ['avs futebol sad'],
            'porto': ['fc porto', 'futebol clube do porto']
        };

        const getSearchTerms = (name: string) => {
            const n = normalize(name);
            const terms = new Set([n]);
            // Extract key words (e.g. "Porto" from "FC Porto")
            n.split(' ').forEach(w => { if (w.length > 3) terms.add(w); });
            Object.entries(nicknames).forEach(([key, val]) => {
                if (n.includes(key) || key.includes(n)) val.forEach(v => terms.add(v));
            });
            return Array.from(terms);
        };

        const targetHTerms = getSearchTerms(homeTeam);
        const targetATerms = getSearchTerms(awayTeam);

        const match = matches.find(m => {
            const h = normalize(m.homeTeam.name);
            const a = normalize(m.awayTeam.name);

            // Stricter matching: ONE team from prediction MUST match Home API, 
            // AND the OTHER team from prediction MUST match Away API.
            const homeMatchesH = targetHTerms.some(t => h.includes(t) || t.includes(h));
            const homeMatchesA = targetHTerms.some(t => a.includes(t) || t.includes(a));

            const awayMatchesH = targetATerms.some(t => h.includes(t) || t.includes(h));
            const awayMatchesA = targetATerms.some(t => a.includes(t) || t.includes(a));

            const normalOrder = homeMatchesH && awayMatchesA;
            const swappedOrder = homeMatchesA && awayMatchesH;

            return normalOrder || swappedOrder;
        });

        if (match) {
            console.info(`[Verifier] SUCCESS: Found ${match.homeTeam.name} vs ${match.awayTeam.name} for ${homeTeam} vs ${awayTeam}`);
            return match.id;
        } else {
            console.warn(`[Verifier] FAILED: No match found for ${homeTeam} vs ${awayTeam}`);
            return null;
        }
    } catch (e: any) {
        if (e.response?.status === 429) throw e;
        console.error("[Verifier] API Error during search:", homeTeam, "vs", awayTeam);
        return null;
    }
}

/**
 * verifyMatch
 * 
 * Main orchestration for match verification. Retrieves match status/results and 
 * settles predictions.
 */
export async function verifyMatch(item: HistoryItem, apiKey: string, date?: string): Promise<HistoryItem> {
    let matchId: number | null = item.matchId || extractMatchId(item.id || '');

    // Trigger Healer if extraction fails (older "local" IDs)
    if (!matchId) {
        matchId = await findMatchByTeams(item.homeTeam, item.awayTeam, date, apiKey);
    }

    if (!matchId) return { ...item, result: 'Pending' };

    try {
        const response = await axios.get(`https://api.football-data.org/v4/matches/${matchId}`, {
            headers: { 'X-Auth-Token': apiKey }
        });

        const match = response.data as FootballDataMatch;

        // Skip verification if match hasn't started or isn't finished enough to be certain
        if (match.status !== 'FINISHED' && match.status !== 'IN_PLAY' && match.status !== 'PAUSED') {
            return { ...item, result: 'Pending', matchId };
        }

        const { home, away } = match.score.fullTime;
        if (home === null || away === null) return { ...item, result: 'Pending', matchId };

        const result = verifyPrediction(
            item.prediction,
            home,
            away,
            match.score.halfTime.home,
            match.score.halfTime.away
        );

        return {
            ...item,
            result: match.status === 'FINISHED' ? result : 'Pending',
            score: formatScore(match),
            matchId
        };

    } catch (error: any) {
        if (error.response?.status === 429) throw error;
        return { ...item, matchId };
    }
}