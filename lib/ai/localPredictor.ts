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
function selectBetType(analysis: MatchAnalysis): typeof ALLOWED_BET_TYPES[number] {
  const { homeScore, awayScore, expectedGoalsHome, expectedGoalsAway, bttsProbability } = analysis;
  const totalGoals = expectedGoalsHome + expectedGoalsAway;
  const scoreDiff = homeScore - awayScore;

  const candidates: (typeof ALLOWED_BET_TYPES[number])[] = [];

  // --- Team win / draw ---
  if (scoreDiff > 25) {
      candidates.push('Home Team to Win');
      candidates.push('Handicap (-1.5) Home Team'); // Strong home win
  }
  if (scoreDiff < -25) {
      candidates.push('Away Team to Win');
  }
  if (scoreDiff > 10) {
      candidates.push('Home Team to Win or Draw');
  }
  if (scoreDiff < -10) {
      candidates.push('Away Team to Win or Draw');
  }
  if (Math.abs(scoreDiff) < 10) {
      candidates.push('Draw');
  }
  if (homeScore > 60) { // arbitrary threshold for a team being generally strong
      candidates.push('Team to Score: Home');
      candidates.push('Home Team to Score in 1st Half: Yes');
  }
  if (awayScore > 60) {
      candidates.push('Team to Score: Away');
      candidates.push('Away Team to Score in 2nd Half: Yes');
  }


  // --- BTTS ---
  if (bttsProbability > 0.65) {
      candidates.push('Both Teams to Score: Yes');
  }
  if (bttsProbability < 0.35) {
      candidates.push('Both Teams to Score: No');
  }

  // --- Goal-based bets ---
  if (totalGoals > 3.5) {
      candidates.push('Over 2.5 Goals'); // It is also over 2.5
  }
  if (totalGoals > 2.5) {
      candidates.push('Over 2.5 Goals');
  }
  if (totalGoals > 1.5) {
      candidates.push('Over 1.5 Goals');
  }
  if (totalGoals > 0.5) {
      candidates.push('Over 0.5 Goals');
  }
  if (totalGoals < 2.5) {
      candidates.push('Under 2.5 Goals');
  }
  if (totalGoals < 3.5) {
      candidates.push('Under 3.5 Goals');
  }

  // A simple logic for Highest scoring half. More data would be needed for a better prediction.
  if (expectedGoalsHome > 1.5 || expectedGoalsAway > 1.5) {
      candidates.push('Highest Scoring Half: 2nd'); // More goals are often scored in the 2nd half
  } else {
      candidates.push('Highest Scoring Half: 1st');
  }
  
  // De-duplicate candidates
  const uniqueCandidates = [...new Set(candidates)];
  
  // Fallback if no candidates
  if (uniqueCandidates.length === 0) {
      return 'No Pick';
  }

  // Simple strategy: pick a random candidate to provide more variety
  return uniqueCandidates[Math.floor(Math.random() * uniqueCandidates.length)];
}

// --- Generate single prediction ---
export function generateLocalPrediction(
  fixture: FullAPIFixture,
  idx: number
): Prediction {
  const analysis = analyzeMatch(fixture);
  const betType = selectBetType(analysis);

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
  fixtureData: FullAPIFixture[]
): Prediction[] {
  console.info(`[LocalPredictor] Generating ${fixtureData.length} predictions`);

  const predictions = fixtureData.map((fixture, idx) =>
    generateLocalPrediction(fixture, idx)
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