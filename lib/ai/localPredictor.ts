import { ALLOWED_BET_TYPES, type Prediction } from '../schemas';
import type { FullAPIFixture } from './types';



const LEAGUE_STRENGTH_MAP: Record<string, number> = {
  'Champions League': 1.0,
  'Premier League': 1.0,
  'La Liga': 1.0,
  'Serie A': 1.0,
  'Bundesliga': 1.0,
  'Europa League': 0.9,
  'Ligue 1': 0.9,
  'Eredivisie': 0.8,
  'Primeira Liga': 0.8,
  'Super Lig': 0.7,
  'Championship': 0.7,
  'Greek Super League': 0.6,
  'Allsvenskan': 0.6,
  'Serie B': 0.5,
};

const FACTOR_WEIGHTS = {
  form: 1.5,
  rank: 1.2,
  goalsFor: 1.2,
  goalsAgainst: 0.8,
  cleanSheet: 0.5,
  h2h: 0.5,
};

interface MatchAnalysis {
  homeScore: number;
  awayScore: number;
  expectedGoalsHome: number;
  expectedGoalsAway: number;
  confidence: number;
  bttsProbability: number;
}

interface H2HData {
  homeWins?: number;
  awayWins?: number;
  draws?: number;
}

// --- Analyze a single match (v2 - with weighted factors and league strength) ---
function analyzeMatch(fixture: FullAPIFixture): MatchAnalysis {
  const home = fixture.stats?.homeTeam || {};
  const away = fixture.stats?.awayTeam || {};
  const h2h = fixture.stats?.h2h as H2HData || {};

  // --- Get League Strength ---
  // Default to 0.7 if league not in map
  const leagueStrength = LEAGUE_STRENGTH_MAP[fixture.league?.name || ''] || 0.7;

  const normalize = (val: number, max: number) => Math.min(1, Math.max(0, val / max));

  // --- Weighted Scores / stats ---
  const homeForm = normalize(home.form?.match(/W/g)?.length || 0, 5);
  const awayForm = normalize(away.form?.match(/W/g)?.length || 0, 5);

  const maxRank = 20;
  const homeRank = home.leagueRank ? (maxRank - home.leagueRank) / (maxRank - 1) : 0;
  const awayRank = away.leagueRank ? (maxRank - away.leagueRank) / (maxRank - 1) : 0;

  const homeGoalsFor = normalize(home.goals || 0, 30);
  const awayGoalsFor = normalize(away.goals || 0, 30);

  // Lower goalsAgainst is better, so we invert the normalized value
  const homeGoalsAgainst = 1 - normalize(home.goalsAgainst || 30, 30);
  const awayGoalsAgainst = 1 - normalize(away.goalsAgainst || 30, 30);

  const homeCleanSheet = normalize(home.cleanSheets || 0, 10);
  const awayCleanSheet = normalize(away.cleanSheets || 0, 10);

  // --- H2H ---
  const totalH2H = (h2h.homeWins || 0) + (h2h.awayWins || 0) + (h2h.draws || 0);
  const homeH2H = totalH2H > 0 ? ((h2h.homeWins || 0) / totalH2H) : 0.5; // Default to 0.5 if no H2H
  const awayH2H = totalH2H > 0 ? ((h2h.awayWins || 0) / totalH2H) : 0.5;

  // --- Calculate weighted team scores with Dynamic Weighting ---
  // If a stat is missing, we don't treat it as 0. We remove its weight 
  // and redistribute the importance to available stats.

  const calculateScore = (stats: any, formVal: number, rankVal: number, gForVal: number, gAgainstVal: number, csVal: number, h2hVal: number) => {
    let score = 0;
    let totalWeight = 0;

    // Form
    if (stats.form) {
      score += formVal * FACTOR_WEIGHTS.form;
      totalWeight += FACTOR_WEIGHTS.form;
    }

    // Rank
    if (stats.leagueRank) {
      score += rankVal * FACTOR_WEIGHTS.rank;
      totalWeight += FACTOR_WEIGHTS.rank;
    }

    // Goals For
    if (stats.goals !== undefined) {
      score += gForVal * FACTOR_WEIGHTS.goalsFor;
      totalWeight += FACTOR_WEIGHTS.goalsFor;
    }

    // Goals Against
    if (stats.goalsAgainst !== undefined) {
      score += gAgainstVal * FACTOR_WEIGHTS.goalsAgainst;
      totalWeight += FACTOR_WEIGHTS.goalsAgainst;
    }

    // Clean Sheets
    if (stats.cleanSheets !== undefined) {
      score += csVal * FACTOR_WEIGHTS.cleanSheet;
      totalWeight += FACTOR_WEIGHTS.cleanSheet;
    }

    // H2H (Always check if totalH2H > 0)
    if (totalH2H > 0) {
      score += h2hVal * FACTOR_WEIGHTS.h2h;
      totalWeight += FACTOR_WEIGHTS.h2h;
    }

    // Normalize: If no data at all, return 0.5 (middle)
    if (totalWeight === 0) return 0.5;

    // We normalize the score back to a 0-1 scale based on active weights
    return score / totalWeight;
  };

  const homeNormalized = calculateScore(home, homeForm, homeRank, homeGoalsFor, homeGoalsAgainst, homeCleanSheet, homeH2H);
  const awayNormalized = calculateScore(away, awayForm, awayRank, awayGoalsFor, awayGoalsAgainst, awayCleanSheet, awayH2H);

  // --- Amplify scores by league strength & scale up ---
  // We use a base multiplier of 400 to keep the score ranges consistent with previous logic
  const homeScore = Math.round(homeNormalized * leagueStrength * 400);
  const awayScore = Math.round(awayNormalized * leagueStrength * 400);

  // --- Expected goals (More robust handling of missing data) ---
  const baseGoals = 1.2;

  // If we have raw goal stats, we use them. Otherwise, we use the normalized strength as a fallback.
  const homeAttack = home.goals !== undefined ? homeGoalsFor : homeNormalized;
  const awayDefense = away.cleanSheets !== undefined ? awayCleanSheet : awayNormalized;

  const awayAttack = away.goals !== undefined ? awayGoalsFor : awayNormalized;
  const homeDefense = home.cleanSheets !== undefined ? homeCleanSheet : homeNormalized;

  let expectedGoalsHome = +(baseGoals + (homeAttack * 1.5) - (awayDefense * 0.8)).toFixed(2);
  let expectedGoalsAway = +(baseGoals + (awayAttack * 1.5) - (homeDefense * 0.8)).toFixed(2);

  expectedGoalsHome = Math.min(3.5, Math.max(0.5, expectedGoalsHome));
  expectedGoalsAway = Math.min(3.5, Math.max(0.5, expectedGoalsAway));

  // --- BTTS probability (remains a simple heuristic) ---
  const pHomeGoal = Math.min(0.95, expectedGoalsHome / 3);
  const pAwayGoal = Math.min(0.95, expectedGoalsAway / 3);
  const bttsProbability = +(1 - (1 - pHomeGoal) * (1 - pAwayGoal)).toFixed(2);

  // --- Confidence Calculation ---
  // Data completeness check
  const completeness =
    (home.form ? 1 : 0) +
    (home.leagueRank ? 1 : 0) +
    (home.goals !== undefined ? 1 : 0) +
    (home.goalsAgainst !== undefined ? 1 : 0) +
    (away.form ? 1 : 0) +
    (away.leagueRank ? 1 : 0) +
    (away.goals !== undefined ? 1 : 0) +
    (away.goalsAgainst !== undefined ? 1 : 0) +
    (totalH2H ? 1 : 0);

  // Scale score difference to a 0-1 range. Max possible weighted score is ~5.2.
  // Multiplied by league strength (max 1.0) and 100. So max score is ~520.
  // A score diff of 100 is significant.
  const scoreDiff = Math.abs(homeScore - awayScore);
  const scaledDiff = Math.min(1, scoreDiff / 150);

  // Confidence is a mix of data completeness and how one-sided the match appears
  const confidence = Math.round(Math.min(95, ((completeness / 9) * 0.5 + scaledDiff * 0.5) * 80 + 15));

  return { homeScore, awayScore, expectedGoalsHome, expectedGoalsAway, confidence, bttsProbability };
}

// --- Select bet type covering all ALLOWED_BET_TYPES ---
function getBetCandidates(analysis: MatchAnalysis): { bet: typeof ALLOWED_BET_TYPES[number], safeness: number }[] {
  const { homeScore, awayScore, expectedGoalsHome, expectedGoalsAway, bttsProbability } = analysis;
  const totalGoals = expectedGoalsHome + expectedGoalsAway;
  const scoreDiff = homeScore - awayScore;

  const candidates: { bet: typeof ALLOWED_BET_TYPES[number], safeness: number }[] = [];

  const scaleSafeness = (value: number, min: number, max: number) => {
    return Math.round(Math.max(0, Math.min(100, ((value - min) / (max - min)) * 80 + 20)));
  }

  // --- Team win / draw ---
  if (scoreDiff > 10) {
    candidates.push({ bet: 'Home Team to Win', safeness: scaleSafeness(scoreDiff, 10, 50) });
  }
  if (scoreDiff < -10) {
    candidates.push({ bet: 'Away Team to Win', safeness: scaleSafeness(Math.abs(scoreDiff), 10, 50) });
  }
  if (scoreDiff > 5) {
    candidates.push({ bet: 'Home Team to Win or Draw', safeness: scaleSafeness(scoreDiff, 5, 40) });
  }
  if (scoreDiff < -5) {
    candidates.push({ bet: 'Away Team to Win or Draw', safeness: scaleSafeness(Math.abs(scoreDiff), 5, 40) });
  }
  if (Math.abs(scoreDiff) < 10) {
    candidates.push({ bet: 'Draw', safeness: 100 - scaleSafeness(Math.abs(scoreDiff), 0, 10) });
  }
  if (homeScore > 55) {
    candidates.push({ bet: 'Team to Score: Home', safeness: scaleSafeness(homeScore, 55, 80) });
  }
  if (awayScore > 55) {
    candidates.push({ bet: 'Team to Score: Away', safeness: scaleSafeness(awayScore, 55, 80) });
  }

  // --- BTTS ---
  candidates.push({ bet: 'Both Teams to Score: Yes', safeness: scaleSafeness(bttsProbability, 0.5, 0.8) });
  candidates.push({ bet: 'Both Teams to Score: No', safeness: scaleSafeness(1 - bttsProbability, 0.5, 0.8) });


  // --- Goal-based bets ---
  const goalSafeness = (goals: number, threshold: number) => scaleSafeness(goals, threshold, threshold + 1.5);

  if (totalGoals > 0.5) {
    candidates.push({ bet: 'Over 0.5 Goals', safeness: goalSafeness(totalGoals, 0.5) });
  }
  if (totalGoals > 1.5) {
    candidates.push({ bet: 'Over 1.5 Goals', safeness: goalSafeness(totalGoals, 1.5) });
  }
  if (totalGoals > 2.5) {
    candidates.push({ bet: 'Over 2.5 Goals', safeness: goalSafeness(totalGoals, 2.5) });
  }
  if (totalGoals < 3.5) {
    candidates.push({ bet: 'Under 3.5 Goals', safeness: goalSafeness(3.5 - totalGoals, 0) });
  }
  if (totalGoals < 2.5) {
    candidates.push({ bet: 'Under 2.5 Goals', safeness: goalSafeness(2.5 - totalGoals, 0) });
  }

  if (expectedGoalsHome > 1.2 || expectedGoalsAway > 1.2) {
    candidates.push({ bet: 'Highest Scoring Half: 2nd', safeness: 50 });
  } else {
    candidates.push({ bet: 'Highest Scoring Half: 1st', safeness: 40 });
  }

  // De-duplicate candidates by bet type, keeping the one with the highest safeness
  const uniqueCandidates = Array.from(new Map(candidates.map(c => [c.bet, c])).values());

  // Sort by safeness DESC
  return uniqueCandidates.sort((a, b) => b.safeness - a.safeness);
}

function selectBetType(
  analysis: MatchAnalysis,
  riskLevel: 'very safe' | 'safe' | 'medium safe'
): typeof ALLOWED_BET_TYPES[number] {
  const candidates = getBetCandidates(analysis);

  if (candidates.length === 0) {
    return 'No Pick';
  }

  if (riskLevel === 'very safe') {
    const bestCandidate = candidates.find(c => c.safeness >= 85);
    return bestCandidate ? bestCandidate.bet : 'No Pick';
  }

  if (riskLevel === 'safe') {
    // First, try to find a bet in the 'safe' range
    let bestCandidate = candidates.find(c => c.safeness >= 70 && c.safeness < 85);

    // If no 'safe' bet is found, fall back to a 'very safe' one
    if (!bestCandidate) {
      bestCandidate = candidates.find(c => c.safeness >= 85);
    }

    return bestCandidate ? bestCandidate.bet : 'No Pick';
  }

  if (riskLevel === 'medium safe') {
    const bestCandidate = candidates.find(c => c.safeness >= 50 && c.safeness < 70);
    return bestCandidate ? bestCandidate.bet : 'No Pick';
  }

  // Fallback for any other case
  return 'No Pick';
}

// --- Generate single prediction ---
export function generateLocalPrediction(
  fixture: FullAPIFixture,
  idx: number,
  riskLevel: 'very safe' | 'safe' | 'medium safe'
): Prediction {
  const analysis = analyzeMatch(fixture);
  const betType = selectBetType(analysis, riskLevel);

  const confidenceVariation = Math.random() * 10 - 5;
  const finalConfidence = Math.max(25, Math.min(95, analysis.confidence + confidenceVariation));

  return {
    id: `pred-local-${Date.now()}-${idx}`,
    team1: fixture.teams.home.name,
    team2: fixture.teams.away.name,
    betType: betType as typeof ALLOWED_BET_TYPES[number],
    confidence: Math.round(finalConfidence),
    league: fixture.league?.name || 'Unknown',
    matchTime: 'TBD',
    details: {
      team1Form: fixture.stats?.homeTeam?.form || 'N/A',
      team2Form: fixture.stats?.awayTeam?.form || 'N/A',
      team1Stats: {
        goalsFor: fixture.stats?.homeTeam?.goals || 0,
        goalsAgainst: fixture.stats?.homeTeam?.goalsAgainst || 0,
      },
      team2Stats: {
        goalsFor: fixture.stats?.awayTeam?.goals || 0,
        goalsAgainst: fixture.stats?.awayTeam?.goalsAgainst || 0,
      },
      h2h: {
        homeWins: fixture.stats?.h2h?.homeWins || 0,
        awayWins: fixture.stats?.h2h?.awayWins || 0,
        draws: fixture.stats?.h2h?.draws || 0,
      },
    },
  };
}

// --- Generate predictions for multiple matches ---
export function generateLocalPredictions(
  fixtureData: FullAPIFixture[],
  riskLevel: 'very safe' | 'safe' | 'medium safe'
): Prediction[] {
  console.info(`[LocalPredictor] Generating ${fixtureData.length} predictions with risk level: ${riskLevel}`);

  const predictions = fixtureData.map((fixture, idx) =>
    generateLocalPrediction(fixture, idx, riskLevel)
  );

  const betTypeCounts = predictions.reduce((acc, p) => {
    acc[p.betType] = (acc[p.betType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length);

  console.info(`[LocalPredictor] Bet types:`, betTypeCounts);
  console.info(`[LocalPredictor] Avg confidence:`, avgConfidence);

  return predictions;
}