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
            day.predictions.some((p: any) => p.result === 'Pending') || day.date === '2026-01-02'
        );

        if (pendingDays.length === 0) {
            return res.status(200).json({ updatedCount: 0, status: 'All up to date' });
        }

        // Calculate range
        // Prioritize RECENT matches first (Last 10 days of pending items)
        const dates = pendingDays.map(d => d.date).sort((a, b) => b.localeCompare(a)); // Descending
        const latestPending = dates[0];

        // Target a 30-day window ending at the latest pending day
        // This clears backlogs much faster than a 10-day window.
        maxDate = latestPending;
        const minDateObj = new Date(latestPending);
        minDateObj.setDate(minDateObj.getDate() - 30);
        minDate = minDateObj.toISOString().split('T')[0];

        // Ensure we don't go back too far (max 90 days total history)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        const minDateLimit = ninetyDaysAgo.toISOString().split('T')[0];

        if (minDate < minDateLimit) {
            minDate = minDateLimit;
        }

        console.info(`[Verifier] Bulk syncing 30-day window: ${minDate} to ${maxDate}`);

        // console.log(`[Verifier] Bulk fetching matches from ${minDate} to ${maxDate}...`);

        // Fetch Operations (Bulk)
        let allMatches = [];
        try {
            const response = await axios.get(`https://api.football-data.org/v4/matches`, {
                headers: { 'X-Auth-Token': apiKey },
                params: { dateFrom: minDate, dateTo: maxDate }
            });
            allMatches = response.data.matches || [];
            console.log(`[Verifier] API returned ${allMatches.length} matches.`);
        } catch (apiErr: any) {
            console.warn(`[Verifier] Football-Data API failed or range restricted. Falling back to Scraper only.`, apiErr.message);
            // We continue with allMatches = [] so the loop below uses the scraper fallback.
        }

        let totalUpdated = 0;

        // --- Processing Logic ---
        for (const day of pendingDays) {
            // Processing items within our 30-day target window.
            // Items outside this window will be caught in subsequent syncs.
            if (day.date < minDate || day.date > maxDate) continue;

            let dayChanged = false;
            let scrapedToday = false;
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
                    if (dayMatches.length === 0 && !scrapedToday) {
                        try {
                            const { scrapeBBCMatches } = await import('@/lib/history/scraper');
                            dayMatches = await scrapeBBCMatches(day.date);
                            scrapedToday = true;
                            if (dayMatches.length > 0) {
                                console.info(`[Verifier] Scraped ${dayMatches.length} matches for ${day.date}`);
                            }
                        } catch (e) {
                            console.error(`[Verifier] Scraper failed for ${day.date}:`, e);
                            scrapedToday = true; // Don't keep retrying if it fails
                        }
                    }

                    if (dayMatches.length > 0) {
                        if (day.date === '2026-01-02') {
                            console.log(`[Verifier] Searching for: ${item.homeTeam} vs ${item.awayTeam} in ${dayMatches.length} matches`);
                        }
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