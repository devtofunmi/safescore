import { HistoryItem } from './storage';

/**
 * Football Data API match structure for type safety.
 */

export interface FootballDataMatch {
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
export function verifyPrediction(
    prediction: string,
    homeGoals: number,
    awayGoals: number,
    homeHT: number | null = null,
    awayHT: number | null
): 'Won' | 'Lost' | 'Pending' | 'Postponed' {
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
 * Searches a provided list of matches for a fuzzy string match.
 */
export function findMatchInList(
    homeTeam: string,
    awayTeam: string,
    matches: FootballDataMatch[]
): FootballDataMatch | null {
    const normalize = (n: string) => {
        if (!n) return '';
        return n.toLowerCase()
            // First remove specific long phrases
            .replace(/\bclube de portugal\b/g, '')
            .replace(/\bde portugal\b/g, '')
            // Then remove common club suffixes and prefixes
            .replace(/\b(calcio|futebol clube|clube de|racing club de|clube)\b/g, '')
            .replace(/\b(fc|afc|cf|sc|ac|club|de|ss|ssc|bc|uc|us|cd|sad|cp|osc|stade|as|ogc|rc|fcc|vfl|tsv|ud|ca|sd|cf|rsc|rbfc|fbk|sk|if|bk|jk|aik|ff|aek|paok|fenerbahce|galatasaray|besiktas)\b/g, '')
            .replace(/[\W_]+/g, ' ')
            .trim();
    };

    const nicknames: Record<string, string[]> = {
        'wolves': ['wolverhampton', 'wolverhampton wanderers'],
        'inter': ['internazionale', 'inter milan', 'internazionale milano'],
        'mancity': ['manchester city'],
        'manutd': ['manchester united', 'man utd'],
        'spurs': ['tottenham', 'tottenham hotspur'],
        'avs': ['avs futebol sad'],
        'porto': ['fc porto', 'futebol clube do porto'],
        'benfica': ['sl benfica', 'sport lisboa e benfica'],
        'milan': ['ac milan', 'milan ac'],
        'verona': ['hellas verona'],
        'fiorentina': ['acf fiorentina'],
        'atletico': ['atletico madrid', 'club atletico de madrid'],
        'madrid': ['real madrid', 'atletico madrid'],
        'psg': ['paris saint-germain', 'paris sg'],
        'bayern': ['bayern munich', 'bayern münchen'],
        'bilbao': ['athletic club', 'athletic bilbao'],
        'al-nasr': ['al nasr', 'al-nasr', 'al ahly'],
        'sporting': ['sporting cp', 'sporting lisbon', 'sporting clube de portugal', 'portugal'],
        'vitoria': ['vitoria guimaraes', 'vitoria sc', 'vitoria de guimaraes', 'guimaraes'],
        'gil vicente': ['gil vicente fc', 'gil vicente'],
        'heart': ['hearts', 'heart of midlothian'],
        'lazio': ['ss lazio'],
        'napoli': ['ssc napoli'],
        'coleraine': ['coleraine fc'],
        'cagliari': ['cagliari calcio'],
        'lens': ['racing club de lens', 'rc lens', 'lens'],
        'toulouse': ['toulouse fc', 'toulouse'],
        'rayo': ['rayo vallecano', 'rayo vallecano de madrid', 'rayo'],
        'getafe': ['getafe cf', 'getafe'],
        'nacional': ['cd nacional', 'nacional'],
        'lille': ['lille osc', 'lille'],
        'rennes': ['stade rennais', 'rennes'],
        'reims': ['stade de reims', 'reims'],
        'strasbourg': ['rc strasbourg', 'strasbourg'],
        'nice': ['ogc nice', 'nice'],
        'saint-etienne': ['as saint-etienne', 'st etienne'],
        'monaco': ['as monaco', 'monaco'],
        'marseille': ['olympique marseille', 'om'],
        'lyon': ['olympique lyon', 'ol'],
        'hull': ['hull city'],
        'watford': ['watford fc'],
        'ipswich': ['ipswich town'],
        'portsmouth': ['portsmouth fc']
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

    return matches.find(m => {
        const h = normalize(m.homeTeam.name);
        const a = normalize(m.awayTeam.name);

        const homeMatchesH = targetHTerms.some(t => h.includes(t) || t.includes(h));
        const homeMatchesA = targetHTerms.some(t => a.includes(t) || t.includes(a));
        const awayMatchesH = targetATerms.some(t => h.includes(t) || t.includes(h));
        const awayMatchesA = targetATerms.some(t => a.includes(t) || t.includes(a));

        const normalOrder = homeMatchesH && awayMatchesA;
        const swappedOrder = homeMatchesA && awayMatchesH;

        return normalOrder || swappedOrder;
    }) || null;
}

/**
 * Verifies a prediction using a provided Match object (avoids API calls)
 */

export function verifyMatchFromData(item: HistoryItem, match: FootballDataMatch): HistoryItem {
    // Handle Postponed/Cancelled matches as 'Postponed' to clear pending status
    if (match.status === 'CANCELLED' || match.status === 'POSTPONED' || match.status === 'SUSPENDED') {
        return { ...item, result: 'Postponed', score: 'PPD', matchId: match.id };
    }

    if (match.status !== 'FINISHED' && match.status !== 'IN_PLAY' && match.status !== 'PAUSED') {
        return { ...item, result: 'Pending', matchId: match.id };
    }

    const { home, away } = match.score.fullTime;
    if (home === null || away === null) return { ...item, result: 'Pending', matchId: match.id };

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
        matchId: match.id
    };
}

