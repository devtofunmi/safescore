import { type Prediction, type BetType } from '../schemas';
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
  const getFormPoints = (form: string) => {
    if (!form) return 0;
    const wins = form.match(/W/g)?.length || 0;
    const draws = form.match(/D/g)?.length || 0;
    return wins * 3 + draws * 1;
  };
  const homeForm = normalize(getFormPoints(home.form || ''), 15); // 5 games * 3 points/win
  const awayForm = normalize(getFormPoints(away.form || ''), 15);

  const maxRank = 20;
  const homeRank = home.leagueRank ? (maxRank - home.leagueRank) / (maxRank - 1) : 0;
  const awayRank = away.leagueRank ? (maxRank - away.leagueRank) / (maxRank - 1) : 0;

  const homeGoals = normalize(home.goals || 0, 30);
  const awayGoals = normalize(away.goals || 0, 30);

  const homeDefense = normalize(home.cleanSheets || 0, 10);
  const awayDefense = normalize(away.cleanSheets || 0, 10);

  // --- H2H ---
  const totalH2H = (h2h.homeWins || 0) + (h2h.awayWins || 0) + (h2h.draws || 0);
  const homeH2H = totalH2H > 0 ? (h2h.homeWins || 0) / totalH2H : 0.5; // Default to 0.5 if no H2H
  const awayH2H = totalH2H > 0 ? (h2h.awayWins || 0) / totalH2H : 0.5;

  // --- Overall score with weighted factors ---
  const weights = {
    rank: 0.4,
    form: 0.3,
    goals: 0.15,
    h2h: 0.1,
    defense: 0.05,
  };

  const homeScore = Math.round(
    (homeRank * weights.rank +
      homeForm * weights.form +
      homeGoals * weights.goals +
      homeH2H * weights.h2h +
      homeDefense * weights.defense) *
      100
  );
  const awayScore = Math.round(
    (awayRank * weights.rank +
      awayForm * weights.form +
      awayGoals * weights.goals +
      awayH2H * weights.h2h +
      awayDefense * weights.defense) *
      100
  );

  // --- Expected goals ---
  const baseGoals = 0.7; 
  let expectedGoalsHome = baseGoals + (homeScore / 100) * 2.8;
  let expectedGoalsAway = baseGoals + (awayScore / 100) * 2.8;

  expectedGoalsHome -= (awayDefense * 0.4);
  expectedGoalsAway -= (homeDefense * 0.4);

  expectedGoalsHome = +(Math.min(4.0, Math.max(0.1, expectedGoalsHome)).toFixed(2));
  expectedGoalsAway = +(Math.min(4.0, Math.max(0.1, expectedGoalsAway)).toFixed(2));

  // --- BTTS probability ---
  const pHomeGoal = Math.min(0.95, expectedGoalsHome / 2);
  const pAwayGoal = Math.min(0.95, expectedGoalsAway / 2);
  const bttsProbability = +(pHomeGoal * pAwayGoal).toFixed(2);

  // --- Confidence ---
  const completeness =
    (home.form ? 1 : 0) +
    (home.leagueRank ? 1 : 0) +
    (home.goals !== undefined ? 1 : 0) +
    (away.form ? 1 : 0) +
    (away.leagueRank ? 1 : 0) +
    (away.goals !== undefined ? 1 : 0) +
    (totalH2H > 0 ? 1 : 0);

  const scoreDiff = Math.abs(homeScore - awayScore);

  const baseConfidence = 50 + (scoreDiff * 0.4);
  const adjustedCompletenessFactor = (completeness / 7) * 0.6 + 0.4;
  const confidence = Math.round(Math.min(98, baseConfidence * adjustedCompletenessFactor));

  return { homeScore, awayScore, expectedGoalsHome, expectedGoalsAway, confidence, bttsProbability };
}

// --- Select the SAFEST bet type based on analysis ---
function selectBetType(analysis: MatchAnalysis, oddsType?: string): BetType {
  const { homeScore, awayScore, expectedGoalsHome, expectedGoalsAway, bttsProbability, confidence } = analysis;
  const totalGoals = expectedGoalsHome + expectedGoalsAway;
  const scoreDiff = homeScore - awayScore;

  const bets = {
    'over-under': [
      { condition: totalGoals > 3.5 && confidence > 70, bet: 'Over 2.5 Goals' },
      { condition: totalGoals > 2.8 && confidence > 65, bet: 'Over 1.5 Goals' },
      { condition: totalGoals > 1.2 && confidence > 50, bet: 'Over 0.5 Goals' },
      { condition: totalGoals < 1.5 && confidence > 70, bet: 'Under 2.5 Goals' },
      { condition: totalGoals < 2.2 && confidence > 60, bet: 'Under 3.5 Goals' },
    ],
    'btts': [
      { condition: bttsProbability > 0.65 && confidence > 60, bet: 'Both Teams to Score: Yes' },
      { condition: bttsProbability < 0.40 && confidence > 60, bet: 'Both Teams to Score: No' },
    ],
    'match-winner': [
      { condition: scoreDiff > 40 && confidence > 75, bet: 'Home Team to Win' },
      { condition: scoreDiff < -40 && confidence > 75, bet: 'Away Team to Win' },
      { condition: Math.abs(scoreDiff) < 15 && confidence > 65, bet: 'Draw' },
      { condition: scoreDiff > 15 && confidence > 60, bet: 'Home Team to Win or Draw' },
      { condition: scoreDiff < -15 && confidence > 60, bet: 'Away Team to Win or Draw' },
    ]
  };

  if (oddsType && bets[oddsType as keyof typeof bets]) {
    for (const bet of bets[oddsType as keyof typeof bets]) {
      if (bet.condition) return bet.bet as BetType;
    }
  }

  // --- Generic Tiered Logic if no oddsType is specified or no bet was found ---
  
  // Tier 1: Very High Confidence "Obvious" Bets
  if (confidence > 85) {
    if (scoreDiff > 50) return 'Home Team to Win or Draw';
    if (scoreDiff < -50) return 'Away Team to Win or Draw';
  }
  
  // Tier 2: Goal-based "Safe" Bets
  if (totalGoals > 1.1) return 'Over 0.5 Goals';

  // Tier 3: Strong Win/Draw Predictions
  if (confidence > 75) {
    if (scoreDiff > 35) return 'Home Team to Win';
    if (scoreDiff < -35) return 'Away Team to Win';
  }

  // Tier 4: Over/Under Goal Bets
  if (totalGoals > 3.2 && confidence > 65) return 'Over 2.5 Goals';
  if (totalGoals > 2.6 && confidence > 60) return 'Over 1.5 Goals';
  if (totalGoals < 1.7 && confidence > 65) return 'Under 2.5 Goals';

  // Tier 5: Both Teams to Score (BTTS) Bets
  if (bttsProbability > 0.70 && confidence > 60) return 'Both Teams to Score: Yes';
  if (bttsProbability < 0.35 && confidence > 65) return 'Both Teams to Score: No';

  // Tier 6: Draw Prediction
  if (Math.abs(scoreDiff) < 10 && confidence > 70) return 'Draw';

  // Fallback to a double chance bet if one team is moderately favored
  if (confidence > 55) {
    if (homeScore > awayScore) return 'Home Team to Win or Draw';
    if (awayScore > homeScore) return 'Away Team to Win or Draw';
  }

  return 'No Pick';
}

// --- Generate single prediction ---
export function generateLocalPrediction(
  fixture: FullAPIFixture,
  idx: number,
  oddsType?: string
): Prediction {
  const analysis = analyzeMatch(fixture);
  const betType = selectBetType(analysis, oddsType);

  // Adjust confidence based on the bet type itself. Safer bets get a boost.
  let finalConfidence = analysis.confidence;
  if (betType.includes('0.5 Goals') || betType.includes('Win or Draw')) {
    finalConfidence = Math.min(99, finalConfidence + 5);
  } else if (betType.includes('Under 3.5') || betType.includes('Over 1.5')) {
    finalConfidence = Math.min(97, finalConfidence + 2);
  }

  return {
    id: `pred-local-${Date.now()}-${idx}`,
    team1: fixture.teams.home.name,
    team2: fixture.teams.away.name,
    betType: betType,
    confidence: Math.round(Math.max(30, Math.min(99, finalConfidence))),
    league: fixture.league?.name || 'Unknown',
    matchTime: 'TBD',
  };
}

// --- Generate predictions for multiple matches ---
export function generateLocalPredictions(
  fixtureData: FullAPIFixture[],
  oddsType?: string
): Prediction[] {
  console.log(`[LocalPredictor] Generating ${fixtureData.length} predictions with oddsType: ${oddsType || 'any'}`);

  const predictions = fixtureData.map((fixture, idx) =>
    generateLocalPrediction(fixture, idx, oddsType)
  );

  const betTypeCounts = predictions.reduce((acc, p) => {
    acc[p.betType] = (acc[p.betType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgConfidence = predictions.length > 0 
    ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length)
    : 0;

  console.log(`[LocalPredictor] Bet types:`, betTypeCounts);
  console.log(`[LocalPredictor] Avg confidence:`, avgConfidence);

  return predictions;
}