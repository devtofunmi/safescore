import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

/**
 * Historical Sync Endpoint with Supabase - UPDATED FOR BULK PROCESSING
 * 
 * Verifies pending predictions in the Supabase 'history' table using the 
 * Football-Data.org API.
 * 
 * Optimized to fetch ALL relevant matches in a single API call (or few calls)
 */

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Prevent caching for verification results
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    try {
        const { verifyMatchFromData, findMatchInList, extractMatchId } = await import('@/lib/history/verifier');
        const apiKey = process.env.FOOTBALL_DATA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing FOOTBALL_DATA_API_KEY configuration' });
        }

        // Fetch History from Supabase
        const { data: historyData, error: fetchError } = await supabase
            .from('history')
            .select('*')
            .order('date', { ascending: false });

        if (fetchError) throw fetchError;
        if (!historyData || historyData.length === 0) {
            return res.status(200).json({ updatedCount: 0, status: 'No history found' });
        }

        // Identify Pending Date Range
        let minDate = '';
        let maxDate = '';
        const pendingDays = historyData.filter(day =>
            day.predictions.some((p: any) => p.result === 'Pending')
        );

        if (pendingDays.length === 0) {
            return res.status(200).json({ updatedCount: 0, status: 'All up to date' });
        }

        // Calculate range
        // pendingDays is sorted desc by default query, so max is [0], min is [last]

        const dates = pendingDays.map(d => d.date).sort(); // Ascending
        minDate = dates[0];
        maxDate = new Date().toISOString().split('T')[0]; // Valid up to today

        // limiting to 10 days for API safety per request
        // API allows 10 days max range usually.
        const minDateObj = new Date(minDate);

        // If range > 9 days, just clip minDate to 9 days ago to be safe for this run
        // Subsequent runs will catch older ones if needed, or  implement loop.
        // simple logic: Last 60 days covers most backlogs.
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        if (minDateObj < sixtyDaysAgo) {
            minDate = sixtyDaysAgo.toISOString().split('T')[0];
        }

        // console.log(`[Verifier] Bulk fetching matches from ${minDate} to ${maxDate}...`);

        // Fetch Operations (Bulk)
        const response = await axios.get(`https://api.football-data.org/v4/matches`, {
            headers: { 'X-Auth-Token': apiKey },
            params: { dateFrom: minDate, dateTo: maxDate }
        });

        const allMatches = response.data.matches || [];
        // console.log(`[Verifier] Fetched ${allMatches.length} matches from API.`);

        let totalUpdated = 0;

        // --- Processing Logic ---
        for (const day of pendingDays) {
            if (day.date < minDate) continue;

            let dayChanged = false;
            let dayMatches: any[] = []; // Store scraped matches for this day if needed

            // Optimization: Filter API matches for this day (simple date string check if possible, or just use all)
            // API returns ISO, we have YYYY-MM-DD. 
            // We'll just search the whole bulk list first.

            const updatedPredictions = [];

            for (const item of day.predictions) {
                if (item.result !== 'Pending') {
                    updatedPredictions.push(item);
                    continue;
                }

                // Try API Bulk List
                let match = null;
                const existingId = item.matchId || extractMatchId(item.id);

                if (existingId) {
                    match = allMatches.find((m: any) => m.id === existingId);
                }

                if (!match) {
                    match = findMatchInList(item.homeTeam, item.awayTeam, allMatches);
                }

                // Fallback: Scraper (if API failed)
                // Only trigger if haven't found it AND it's a past date (today or older)
                if (!match) {
                    // Lazy load scraped matches for this day only if needed
                    if (dayMatches.length === 0) {
                        try {
                            const { scrapeBBCMatches } = await import('@/lib/history/scraper');
                            // Only scrape if it's not too far in future? 
                            dayMatches = await scrapeBBCMatches(day.date);
                        } catch (e) {
                            console.error('[Verifier] Scraper failed:', e);
                        }
                    }

                    if (dayMatches.length > 0) {
                        match = findMatchInList(item.homeTeam, item.awayTeam, dayMatches);
                        if (match) console.info(`[Verifier] Recovered via Scraper: ${item.homeTeam} vs ${item.awayTeam}`);
                    }
                }

                if (match) {
                    // Verify
                    const verifiedItem = verifyMatchFromData(item, match);
                    updatedPredictions.push(verifiedItem);

                    if (
                        verifiedItem.result !== item.result ||
                        verifiedItem.score !== item.score ||
                        verifiedItem.matchId !== item.matchId
                    ) {
                        dayChanged = true;
                        if (verifiedItem.result !== 'Pending') totalUpdated++;
                    }
                } else {
                    // Still missing
                    updatedPredictions.push(item);
                }
            }

            // Update Supabase
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
            status: totalUpdated > 0 ? 'Results synchronized' : 'Up to date (Bulk)',
            isPending: false // processed everything  could find
        });

    } catch (err: any) {
        if (err.response) {
            console.error('[Verifier API] API Error:', err.response.data);
        } else {
            console.error('[Verifier API] Fatal Error:', err.message);
        }
        res.status(500).json({ error: 'Sync failed', updatedCount: 0 });
    }
}