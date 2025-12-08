import { ALLOWED_BET_TYPES, type Prediction } from '../schemas';
import type { FullAPIFixture } from './types';

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

// --- Analyze a single match ---
function analyzeMatch(fixture: FullAPIFixture): MatchAnalysis {
  const home = fixture.stats?.homeTeam || {};
  const away = fixture.stats?.awayTeam || {};
  const h2h = fixture.stats?.h2h as H2HData || {};

  const normalize = (val: number, max: number) => Math.min(1, Math.max(0, val / max));

  // --- Scores / stats ---
  const homeForm = normalize(home.form?.match(/W/g)?.length || 0, 5);
  const awayForm = normalize(away.form?.match(/W/g)?.length || 0, 5);

  const maxRank = 20;
  const homeRank = home.leagueRank ? (maxRank - home.leagueRank) / (maxRank - 1) : 0;
  const awayRank = away.leagueRank ? (maxRank - away.leagueRank) / (maxRank - 1) : 0;

  const homeGoals = normalize(home.goals || 0, 30);
  const awayGoals = normalize(away.goals || 0, 30);

  const homeDefense = normalize(home.cleanSheets || 0, 10);
  const awayDefense = normalize(away.cleanSheets || 0, 10);

  // --- H2H ---
  const totalH2H = (h2h.homeWins || 0) + (h2h.awayWins || 0) + (h2h.draws || 0);
  const homeH2H = totalH2H ? ((h2h.homeWins || 0) / totalH2H) : 0;
  const awayH2H = totalH2H ? ((h2h.awayWins || 0) / totalH2H) : 0;

  // --- Overall score ---
  const homeScore = Math.round((homeForm + homeRank + homeGoals + homeDefense + homeH2H) * 100);
  const awayScore = Math.round((awayForm + awayRank + awayGoals + awayDefense + awayH2H) * 100);

  // --- Expected goals ---
  const baseGoals = 1.2;
  let expectedGoalsHome = +(baseGoals + homeGoals - awayDefense).toFixed(2);
  let expectedGoalsAway = +(baseGoals + awayGoals - homeDefense).toFixed(2);

  expectedGoalsHome = Math.min(3.5, Math.max(0.3, expectedGoalsHome));
  expectedGoalsAway = Math.min(3.5, Math.max(0.3, expectedGoalsAway));

  // --- BTTS probability ---
  const pHomeGoal = Math.min(0.95, expectedGoalsHome / 3);
  const pAwayGoal = Math.min(0.95, expectedGoalsAway / 3);
  const bttsProbability = +(1 - (1 - pHomeGoal) * (1 - pAwayGoal)).toFixed(2);

  // --- Confidence ---
  const completeness =
    (home.form ? 1 : 0) +
    (home.leagueRank ? 1 : 0) +
    (home.goals !== undefined ? 1 : 0) +
    (away.form ? 1 : 0) +
    (away.leagueRank ? 1 : 0) +
    (away.goals !== undefined ? 1 : 0) +
    (totalH2H ? 1 : 0);

  const scoreDiff = Math.abs(homeScore - awayScore) / 100;
  const confidence = Math.round(Math.min(95, (completeness / 7 + scoreDiff) * 80 + 15));

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

  const riskThresholds = {
      'very safe': 85,
      'safe': 70,
      'medium safe': 50
  };

  const filteredCandidates = candidates.filter(c => c.safeness >= riskThresholds[riskLevel]);

  if (filteredCandidates.length > 0) {
      // Return the safest bet among the filtered candidates
      return filteredCandidates[0].bet;
  }
  
  // Fallback if no candidates meet the risk level
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