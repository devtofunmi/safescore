import type { NextApiRequest, NextApiResponse } from 'next';
import { PredictionsRequestSchema, PredictionsResponseSchema, type PredictionsResponse, type ErrorResponse } from '@/lib/schemas';
import { cache, CACHE_DURATIONS } from '@/lib/cache';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionsResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const parseResult = PredictionsRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid request parameters' });
    return;
  }

  const { oddsType, leagues, day, date } = parseResult.data;

  // 1. Check Cache
  const sortedLeagues = [...leagues].sort().join(',');
  const cacheKey = `api_result:${oddsType}:${sortedLeagues}:${day}:${date || 'current'}`;
  const cachedResponse = cache.get<PredictionsResponse>(cacheKey, CACHE_DURATIONS.FIXTURES);

  if (cachedResponse) {
    return res.status(200).json(cachedResponse);
  }

  try {
    // 2. Delegate to the Core Engine (Remote or local proxy)
    const { runPredictionEngine } = await import('@/lib/ai/engine');
    const predictions = await runPredictionEngine({ leagues, day, date }, oddsType);

    if (!predictions || predictions.length === 0) {
      res.status(404).json({ error: 'No predictions found for selected criteria.' });
      return;
    }

    const response: PredictionsResponse = {
      predictions,
      timestamp: new Date().toISOString(),
      riskLevel: oddsType,
    };

    // 3. Update Cache & History
    cache.set(cacheKey, response);

    const { saveToHistory } = await import('@/lib/history/storage');
    const requestedDate = date || new Date().toISOString().split('T')[0];
    saveToHistory(predictions, requestedDate).catch(console.error);

    res.status(200).json(response);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}