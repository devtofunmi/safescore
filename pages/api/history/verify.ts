import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Historical verification proxy.
 * Delegates the complex logic of fetching results and checking W/L status
 * to the private core engine.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { verifyHistoricalPredictions } = await import('@/lib/ai/engine');

        // This is a background task
        await verifyHistoricalPredictions();

        res.status(200).json({ status: 'Sync triggered' });
    } catch (err) {
        console.error('History sync error:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
}