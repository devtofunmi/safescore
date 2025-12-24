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
    date: string | undefined,
    apiKey: string
): Promise<number | null> {
    if (!date) return null;

    try {
        const matchDate = new Date(date);
        const dateFrom = new Date(matchDate);
        dateFrom.setDate(matchDate.getDate() - 2);

        const fromStr = dateFrom.toISOString().split('T')[0];
        const toStr = date;

        const response = await axios.get(`https://api.football-data.org/v4/matches`, {
            headers: { 'X-Auth-Token': apiKey },
            params: { dateFrom: fromStr, dateTo: toStr }
        });

        const matches = response.data.matches as FootballDataMatch[];
        const normalize = (n: string) => n.toLowerCase().replace(/\s+(fc|afc|cf|sc|ac|united|city|rovers|albion|town|athletic)\b/g, '').trim();

        const targetH = normalize(homeTeam);
        const targetA = normalize(awayTeam);

        const match = matches.find(m => {
            const h = normalize(m.homeTeam.name);
            const a = normalize(m.awayTeam.name);
            return (h.includes(targetH) || targetH.includes(h)) && (a.includes(targetA) || targetA.includes(a));
        });

        return match ? match.id : null;
    } catch (e) {
        console.error("[Verifier] Search failed for", homeTeam, "vs", awayTeam);
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
    let matchId: number | null = extractMatchId(item.id);

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
            return { ...item, result: 'Pending' };
        }

        const { home, away } = match.score.fullTime;
        if (home === null || away === null) return { ...item, result: 'Pending' };

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
            score: formatScore(match)
        };

    } catch (error) {
        return { ...item };
    }
}