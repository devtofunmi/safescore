import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

/**
 * Historical Sync Endpoint (Supabase Edition)
 * 
 * Verifies pending predictions in the Supabase 'history' table using the 
 * Football-Data.org API.
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { verifyMatch, extractMatchId } = await import('@/lib/history/verifier');
        const apiKey = process.env.FOOTBALL_DATA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing FOOTBALL_DATA_API_KEY configuration' });
        }

        // 1. Fetch History from Supabase
        const { data: historyData, error: fetchError } = await supabase
            .from('history')
            .select('*')
            .order('date', { ascending: false });

        if (fetchError) throw fetchError;
        if (!historyData || historyData.length === 0) {
            return res.status(200).json({ updatedCount: 0, status: 'No history found' });
        }

        let totalUpdated = 0;
        let requestsMade = 0;
        const MAX_REQUESTS = 8;

        // 2. Settlement Logic
        for (const day of historyData) {
            const today = new Date().toISOString().split('T')[0];
            if (day.date > today) continue;

            const updatedPredictions: any[] = [];
            let dayChanged = false;

            for (const item of day.predictions) {
                const canVerify = item.result === 'Pending';

                if (canVerify && requestsMade < MAX_REQUESTS) {
                    try {
                        console.info(`[Verifier] Settling: ${item.homeTeam} vs ${item.awayTeam} (${day.date})`);
                        const verifiedItem = await verifyMatch(item, apiKey, day.date);

                        updatedPredictions.push(verifiedItem);

                        // If status changed or matchId was found/attached, mark day as changed
                        if (
                            verifiedItem.result !== item.result ||
                            verifiedItem.score !== item.score ||
                            verifiedItem.matchId !== item.matchId
                        ) {
                            dayChanged = true;
                            if (verifiedItem.result !== 'Pending') totalUpdated++;
                        }

                        requestsMade++;
                        // Standard delay for free tier (10 req/min)
                        await new Promise(r => setTimeout(r, 7500));

                    } catch (e: any) {
                        console.error(`[Verifier] Match verification failed for ${item.homeTeam}:`, e.message);
                        updatedPredictions.push(item);

                        if (e.response?.status === 429) {
                            console.warn("[Verifier] Batch stopped due to rate limiting.");
                            requestsMade = MAX_REQUESTS; // Stop further processing in this run
                            break;
                        }
                    }
                } else {
                    updatedPredictions.push(item);
                }
            }

            // 3. Update Supabase if anything changed for this day
            if (dayChanged) {
                console.info(`[Verifier] Updating records for ${day.date}...`);
                const { error: updateError } = await supabase
                    .from('history')
                    .update({ predictions: updatedPredictions })
                    .eq('date', day.date);

                if (updateError) console.error(`[Verifier] Table update failed for ${day.date}:`, updateError.message);
            }
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