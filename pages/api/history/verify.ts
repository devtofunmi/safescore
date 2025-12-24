import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Historical Sync Endpoint
 * 
 * This endpoint iterates through the local history.json, identifies "Pending" 
 * predictions, and attempts to verify them against live results using the
 * Football-Data.org API.
 * 
 * Rate Limiting: Processes a max of 8 items per request with a 7s delay between 
 * calls to stay within the free tier quota (10 req/min).
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { verifyMatch } = await import('@/lib/history/verifier');
        const apiKey = process.env.FOOTBALL_DATA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing FOOTBALL_DATA_API_KEY configuration' });
        }

        // Load History File
        const historyPath = path.join(process.cwd(), 'data', 'history.json');
        if (!fs.existsSync(historyPath)) {
            return res.status(200).json({ updatedCount: 0, status: 'No history found' });
        }

        const historyData = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
        const verifiedDays: any[] = [];
        let totalUpdated = 0;
        let requestsMade = 0;
        const MAX_REQUESTS = 8;

        // Settlement Logic
        for (const day of historyData) {
            const today = new Date().toISOString().split('T')[0];

            // Optimization: Don't query future matches
            if (day.date > today) {
                verifiedDays.push(day);
                continue;
            }

            const updatedPredictions = [];
            let dayChanged = false;

            for (const item of day.predictions) {
                const likelyHasId = item.id.startsWith('pred-');
                const canVerify = item.result === 'Pending' && (item.matchId || likelyHasId);

                if (canVerify && requestsMade < MAX_REQUESTS) {
                    try {
                        console.info(`[Verifier] Settling: ${item.homeTeam} vs ${item.awayTeam}`);
                        const verifiedItem = await verifyMatch(item, apiKey, day.date);

                        updatedPredictions.push(verifiedItem);

                        if (verifiedItem.result !== 'Pending' || verifiedItem.score !== item.score) {
                            dayChanged = true;
                            totalUpdated++;
                        }

                        requestsMade++;

                        // Respect Rate Limits (Free Tier quota)
                        await new Promise(r => setTimeout(r, 7000));

                    } catch (e: any) {
                        console.error('[Verifier] Match verification failed:', e.message);
                        if (e.response?.status === 429) {
                            console.warn('[Verifier] Rate limit capacity reached. Stopping batch.');
                            updatedPredictions.push(item);
                            break;
                        }
                        updatedPredictions.push(item);
                    }
                } else {
                    updatedPredictions.push(item);
                }
            }

            verifiedDays.push({ ...day, predictions: updatedPredictions });
        }

        // Persistence
        if (totalUpdated > 0) {
            fs.writeFileSync(historyPath, JSON.stringify(verifiedDays, null, 2));
        }

        return res.status(200).json({
            updatedCount: totalUpdated,
            status: totalUpdated > 0 ? 'Results synchronized' : requestsMade >= MAX_REQUESTS ? 'Batch quota filled' : 'Up to date',
            isPending: requestsMade >= MAX_REQUESTS
        });

    } catch (err: any) {
        console.error('[Verifier API] Fatal Error:', err.message);
        res.status(500).json({ error: 'Sync failed', updatedCount: 0 });
    }
}