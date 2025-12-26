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

  const { oddsType, leagues, day, date, userId } = parseResult.data;

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

    // Calculate the reference date for this request 
    const now = new Date();
    const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));

    if (day === 'tomorrow') {
      utcNow.setDate(utcNow.getDate() + 1);
    } else if (day === 'weekend') {
      const dayOfWeek = utcNow.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
      utcNow.setDate(utcNow.getDate() + (daysUntilSaturday === 0 ? 0 : daysUntilSaturday));
    }
    const referenceDate = date || utcNow.toISOString().split('T')[0];

    // Enrich and Group predictions
    const predictionsByDate: Record<string, any[]> = {};
    const enrichedPredictions = predictions.map(p => {
      let extractedDate = '';
      if (p.matchTime && p.matchTime.includes('-')) {
        extractedDate = p.matchTime.includes('T') ? p.matchTime.split('T')[0] : p.matchTime.split(' ')[0];
      }
      const actualDate = /^\d{4}-\d{2}-\d{2}$/.test(extractedDate) ? extractedDate : referenceDate;

      const enriched = {
        ...p,
        matchTime: p.matchTime.includes('-') ? p.matchTime : `${actualDate} ${p.matchTime}`
      };

      if (!predictionsByDate[actualDate]) {
        predictionsByDate[actualDate] = [];
      }
      predictionsByDate[actualDate].push(enriched);

      return enriched;
    });

    const response: PredictionsResponse = {
      predictions: enrichedPredictions,
      timestamp: new Date().toISOString(),
      riskLevel: oddsType,
    };

    // Post-Process: Update Cache & Persist to History
    cache.set(cacheKey, response);

    const { saveToHistory } = await import('@/lib/history/storage');

    // Save each group to its respective date in history
    const savePromises = Object.entries(predictionsByDate).map(async ([mDate, mPredictions]) => {
      if (mDate && /^\d{4}-\d{2}-\d{2}$/.test(mDate)) {
        try {
          await saveToHistory(mPredictions, mDate, userId);
        } catch (err: any) {
          console.error(`[API] History persist failed for ${mDate}:`, err.message);
        }
      }
    });

    await Promise.all(savePromises);

    return res.status(200).json(response);

  } catch (err: any) {
    console.error('[API] Fatal Error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}