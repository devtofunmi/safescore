import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchFixtures } from '@/lib/football/fetchFixtures';
import { fetchExtendedFixtureData } from '@/lib/football/fetchStandings';
import { generateLocalPredictions } from '@/lib/ai/localPredictor';
import { PredictionsRequestSchema, PredictionsResponseSchema, type PredictionsResponse, type ErrorResponse } from '@/lib/schemas';

/**
 * Main API handler for predictions
 * 
 * Implements best practices:
 * ✓ Server-only API keys (no NEXT_PUBLIC_)
 * ✓ Caching for fixtures and standings
 * ✓ Rate limiting (sequential requests with delays)
 * ✓ Strict input validation with Zod
 * ✓ AI output validation and sanitization
 * ✓ Proper error handling and logging
 * ✓ Generic error messages to users (detailed logs on server)
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionsResponse | ErrorResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Validate request body
  const parseResult = PredictionsRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    console.warn('Invalid request body:', parseResult.error.issues);
    res.status(400).json({ error: 'Invalid request parameters' });
    return;
  }

  const { oddsType, leagues, day, date } = parseResult.data;

  // Calculate requested date
  let requestedDate = date || '';
  if (!requestedDate) {
    const today = new Date();
    const target =
      day === 'today'
        ? today
        : day === 'tomorrow'
        ? new Date(today.getTime() + 86400000)
        : new Date(today.getTime() + 5 * 86400000);
    requestedDate = target.toISOString().split('T')[0];
  }

  try {
    // Verify API keys are configured
    const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

    if (!FOOTBALL_DATA_API_KEY) {
      console.error('Missing FOOTBALL_DATA_API_KEY in environment');
      res.status(500).json({ error: 'Service temporarily unavailable. Please try again later.' });
      return;
    }

    // Fetch fixtures (with caching)
    console.info('Fetching fixtures for leagues:', { leagues, day });
    const fixtures = await fetchFixtures(leagues, day);

    if (!fixtures || fixtures.length === 0) {
      console.warn('No fixtures found for the selected criteria');
      res.status(404).json({ error: 'No matches found for the selected leagues and date.' });
      return;
    }

    console.info(`Fetched ${fixtures.length} fixtures`);

    // Enrich fixtures with standings data (with caching)
    // This is optional - if it fails, we continue with basic fixtures
    let extendedFixtures = fixtures;
    try {
      console.info('Enriching fixtures with standings data');
      extendedFixtures = await fetchExtendedFixtureData(fixtures);
      console.info('Successfully enriched fixtures with standings');
    } catch (err) {
      console.warn('Failed to enrich fixtures with standings, continuing with basic fixtures:', err instanceof Error ? err.message : String(err));
      // Continue with non-enriched fixtures
    }

    // Generate predictions using local analysis
    console.info(`Generating ${extendedFixtures.length} predictions using local analysis`);
    const predictions = generateLocalPredictions(extendedFixtures);

    if (!predictions || predictions.length === 0) {
      console.warn('No predictions generated');
      res.status(500).json({ error: 'Unable to generate predictions. Please try again.' });
      return;
    }

    console.info(`Successfully generated ${predictions.length} predictions`);

    // Validate response format before sending
    const response: PredictionsResponse = {
      predictions,
      timestamp: new Date().toISOString(),
      riskLevel: oddsType,
    };

    const validateResponse = PredictionsResponseSchema.safeParse(response);
    if (!validateResponse.success) {
      console.error('Response validation failed:', validateResponse.error.issues);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    res.status(200).json(response);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in predictions handler:', errorMsg);

    // Don't expose internal errors to users
    res.status(500).json({ error: 'Service error. Please try again later.' });
  }
}
