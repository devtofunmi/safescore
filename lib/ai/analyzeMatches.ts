/**
 * @deprecated This file is no longer used - local predictor is used instead
 * Kept for backward compatibility only
 */

import type { Prediction } from '../schemas';

/**
 * @deprecated Use generateLocalPredictions from localPredictor.ts instead
 * This function is no longer called - kept for backward compatibility
 */
export async function analyzeWithGemini(): Promise<Prediction[]> {
  throw new Error('analyzeWithGemini is deprecated. Use localPredictor.generateLocalPredictions instead.');
}
