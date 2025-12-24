import type { NextApiRequest, NextApiResponse } from 'next';
import {
  PredictionsRequestSchema,
  type PredictionsResponse,
  type ErrorResponse
} from '@/lib/schemas';
import { cache, CACHE_DURATIONS } from '@/lib/cache';

/**
 * Handle POST requests to generate betting predictions.
 * Uses a caching layer to minimize external API calls and latency.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionsResponse | ErrorResponse>
) {
  // Method Security
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parameter Validation
  const parseResult = PredictionsRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const { oddsType, leagues, day, date } = parseResult.data;

  // Cache Check
  // Sort leagues to ensure cache hit regardless of array order
  const sortedLeagues = [...leagues].sort().join(',');
  const cacheKey = `api_result:${oddsType}:${sortedLeagues}:${day}:${date || 'current'}`;
  const cachedResponse = cache.get<PredictionsResponse>(cacheKey, CACHE_DURATIONS.FIXTURES);

  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  try {
    // Core Engine Delegation
    // Imports runPredictionEngine dynamically to keep logic decoupled
    const { runPredictionEngine } = await import('@/lib/ai/engine');
    const predictions = await runPredictionEngine({ leagues, day, date }, oddsType);

    if (!predictions || predictions.length === 0) {
      return res.status(404).json({ error: 'No predictions found for selected criteria.' });
    }

    const response: PredictionsResponse = {
      predictions,
      timestamp: new Date().toISOString(),
      riskLevel: oddsType,
    };

    // Post-Process: Update Cache & Persist to History
    cache.set(cacheKey, response);

    const { saveToHistory } = await import('@/lib/history/storage');
    const requestedDate = date || new Date().toISOString().split('T')[0];

    // Non-blocking save to Supabase (cloud persistence)
    saveToHistory(predictions, requestedDate).catch(err => {
      console.error('[API] History persist failed:', err.message);
    });

    return res.status(200).json(response);

  } catch (err: any) {
    console.error('[API] Fatal Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}