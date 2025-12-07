import { parseOddsRange } from '../utils/parseOdds';
import { generateLocalPredictions } from './localPredictor';
import type { FullAPIFixture } from './types';
import type { Prediction } from '../schemas';

/**
 * Analyze fixtures and generate predictions
 * Uses local predictor - instant, no rate limits, uses real match data
 */
export async function analyzeWithGemini(
  fixtureData: FullAPIFixture[],
  oddsType: string,
  oddsRange: string
): Promise<Prediction[]> {
  const [minOdds, maxOdds] = parseOddsRange(oddsRange);

  console.info(`[Predictor] Generating ${fixtureData.length} predictions using local analysis (instant, no rate limits)`);
  return generateLocalPredictions(fixtureData, oddsType, oddsRange, minOdds, maxOdds);
}
