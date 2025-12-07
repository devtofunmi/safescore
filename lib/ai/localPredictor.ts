import { calculateOdds } from '../utils/parseOdds';
import { ALLOWED_BET_TYPES, type Prediction } from '../schemas';
import type { FullAPIFixture } from './types';

interface MatchAnalysis {
  homeScore: number;
  awayScore: number;
  expectedGoals: number;
  confidence: number;
  bttsProbability: number; // probability Both Teams to Score
}

interface H2HData {
  homeWins?: number;
  awayWins?: number;
  draws?: number;
}

function analyzeMatch(fixture: FullAPIFixture): MatchAnalysis {
  const homeStats = fixture.stats?.homeTeam || {};
  const awayStats = fixture.stats?.awayTeam || {};
  const h2h = fixture.stats?.h2h as H2HData || {};

  // Form (0-5 scale) to points
  const homeForm = (homeStats.form?.match(/W/g)?.length || 0) * 15;
  const awayForm = (awayStats.form?.match(/W/g)?.length || 0) * 15;

  // League rank (lower = better)
  const homeRank = homeStats.leagueRank ? (20 - homeStats.leagueRank) * 3 : 0;
  const awayRank = awayStats.leagueRank ? (20 - awayStats.leagueRank) * 3 : 0;

  // Goals scored
  const homeGoals = (homeStats.goals || 0) * 5;
  const awayGoals = (awayStats.goals || 0) * 5;

  // Defensive strength (clean sheets)
  const homeDefense = (homeStats.cleanSheets || 0) * 8;
  const awayDefense = (awayStats.cleanSheets || 0) * 8;

  // H2H influence
  const h2hHome = (h2h.homeWins || 0) * 10;
  const h2hAway = (h2h.awayWins || 0) * 10;

  const homeRawScore = homeForm + homeRank + homeGoals + homeDefense + h2hHome;
  const awayRawScore = awayForm + awayRank + awayGoals + awayDefense + h2hAway;

  const maxPossible = 300;
  const homeScore = Math.max(-100, Math.min(100, (homeRawScore / maxPossible) * 100));
  const awayScore = Math.max(-100, Math.min(100, (awayRawScore / maxPossible) * 100));

  // Expected goals (attack * defense)
  const homeDefRating = 1 - (homeStats.cleanSheets || 0) / 10;
  const awayDefRating = 1 - (awayStats.cleanSheets || 0) / 10;
  const homeAttack = 2 + (homeStats.goals || 0) / 5;
  const awayAttack = 2 + (awayStats.goals || 0) / 5;
  const expectedGoals = homeAttack * homeDefRating + awayAttack * awayDefRating;

  // BTTS probability: simple formula based on scoring ability
  const bttsProbability = Math.min(1, Math.max(0, (homeStats.goals || 0) / 20 + (awayStats.goals || 0) / 20));

  // Confidence based on stat completeness + difference
  const dataCompleteness =
    (homeStats.form ? 20 : 0) +
    (homeStats.leagueRank ? 20 : 0) +
    (homeStats.goals ? 20 : 0) +
    (h2h.homeWins !== undefined ? 20 : 0) +
    (awayStats.form ? 10 : 0) +
    (awayStats.leagueRank ? 10 : 0);

  const scoreDiff = Math.abs(homeScore - awayScore);
  const confidence = Math.min(95, dataCompleteness + scoreDiff / 2);

  return { homeScore, awayScore, expectedGoals, confidence: Math.round(confidence), bttsProbability };
}

function selectBetType(analysis: MatchAnalysis, oddsType: string): string {
  const { homeScore, awayScore, expectedGoals, confidence, bttsProbability } = analysis;

  // Very safe picks
  if (oddsType === 'verysafe') {
    if (homeScore > awayScore + 25) return 'Home Team to Win or Draw';
    if (awayScore > homeScore + 25) return 'Away Team to Win or Draw';
    if (bttsProbability > 0.7) return 'Both Teams to Score: Yes';
    return 'Draw';
  }

  // Safe picks
  if (oddsType === 'safe') {
    if (homeScore > awayScore + 15) return 'Home Team to Win';
    if (awayScore > homeScore + 15) return 'Away Team to Win';
    if (expectedGoals > 2.5) return 'Over 2.5 Goals';
    if (bttsProbability > 0.6) return 'Both Teams to Score: Yes';
    return 'Draw';
  }

  // Medium risk
  if (homeScore > awayScore + 10) return 'Home Team to Win';
  if (awayScore > homeScore + 10) return 'Away Team to Win';
  if (expectedGoals > 2.8) return 'Over 2.5 Goals';
  if (expectedGoals > 1.8) return 'Over 1.5 Goals';
  if (bttsProbability > 0.55) return 'Both Teams to Score: Yes';

  // Close match
  if (Math.abs(homeScore - awayScore) < 5) {
    return confidence > 70 ? 'Both Teams to Score: Yes' : 'Draw';
  }

  return 'Over 1.5 Goals';
}

export function generateLocalPrediction(
  fixture: FullAPIFixture,
  idx: number,
  oddsType: string,
  oddsRange: string,
  minOdds: number,
  maxOdds: number
): Prediction {
  const analysis = analyzeMatch(fixture);
  const betType = selectBetType(analysis, oddsType);

  // ±5% randomness to confidence
  const confidenceVariation = Math.random() * 10 - 5;
  const finalConfidence = Math.max(25, Math.min(95, analysis.confidence + confidenceVariation));

  return {
    id: `pred-local-${Date.now()}-${idx}`,
    team1: fixture.teams.home.name,
    team2: fixture.teams.away.name,
    betType: betType as typeof ALLOWED_BET_TYPES[number],
    confidence: Math.round(finalConfidence),
    odds: calculateOdds(minOdds, maxOdds),
    league: fixture.league?.name || 'Unknown',
    matchTime: 'TBD',
  };
}

export function generateLocalPredictions(
  fixtureData: FullAPIFixture[],
  oddsType: string,
  oddsRange: string,
  minOdds: number,
  maxOdds: number
): Prediction[] {
  console.info(`[LocalPredictor] Generating ${fixtureData.length} predictions`);

  const predictions = fixtureData.map((fixture, idx) =>
    generateLocalPrediction(fixture, idx, oddsType, oddsRange, minOdds, maxOdds)
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
