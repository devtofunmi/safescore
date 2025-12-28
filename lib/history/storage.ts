import { supabaseAdmin } from '../supabase';
import type { Prediction } from '../schemas';

/**
 * Interface representing a single historical prediction entry.
 */
export interface HistoryItem {
    id: string;               // Unique ID
    homeTeam: string;         // Home team
    awayTeam: string;         // Away team
    prediction: string;       // The bet type selected
    result: 'Won' | 'Lost' | 'Pending';
    score: string;            // Final score (e.g., "2-1")
    league?: string;
    matchId?: number;         // Explicit ID for verification
    odds?: number;            // Optional odds value
    userId?: string;          // ID of the user who generated this prediction
}

/**
 * Interface representing a group of predictions for a specific date.
 */
export interface DailyRecord {
    id?: string;
    date: string;            // Format: YYYY-MM-DD
    predictions: HistoryItem[];
    created_at?: string;
}

/**
 * saveToHistory
 * 
 * Persists predictions to Supabase.
 * Groups them by date and merges with any existing records for that day.
 * Uses supabaseAdmin to bypass RLS since this runs on the server.
 */
export async function saveToHistory(predictions: Prediction[], dateStr: string, userId?: string): Promise<void> {
    if (!dateStr || dateStr === 'undefined' || dateStr === 'null') {
        console.error('[History] Cannot save to history: dateStr is invalid:', dateStr);
        return;
    }

    try {
        console.info(`[History] Starting save for ${dateStr} (${predictions.length} predictions) user=${userId || 'anon'}`);

        // Fetch existing record for this date (and user) from Supabase
        let query = supabaseAdmin
            .from('history')
            .select('*')
            .eq('date', dateStr);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        // DEBUG: Check if we have a service key
        // We can't easily check internal properties, but we can assume if it's 'placeholder-key' it will fail auth.
        // Let's rely on the query error to tell us.

        const { data: existingRecords, error: fetchError } = await query;

        if (fetchError) {
            console.error('[History] Fetch error:', fetchError);
            throw fetchError;
        }

        const existingRecord = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null;

        const existingPredictions: HistoryItem[] = existingRecord?.predictions || [];

        // Map incoming predictions to HistoryItem format
        const newItems: HistoryItem[] = predictions.map(p => ({
            id: p.id,
            homeTeam: p.team1,
            awayTeam: p.team2,
            prediction: p.betType,
            result: 'Pending',
            score: '-',
            league: p.league,
            matchId: p.matchId,
            userId: userId
        }));

        // Merge and avoid duplicates (Matched by teams)
        const filteredNewItems = newItems.filter(newItem =>
            !existingPredictions.find(ex => ex.homeTeam === newItem.homeTeam && ex.awayTeam === newItem.awayTeam)
        );

        if (filteredNewItems.length === 0) {
            console.info(`[History] No new items to add for ${dateStr}.`);
            return;
        }

        const updatedPredictions = [...existingPredictions, ...filteredNewItems];

        // Upsert into Supabase
        const payload: any = {
            date: dateStr,
            predictions: updatedPredictions
        };
        if (userId) {
            payload.user_id = userId;
        }

        // We assume constraint is (date, user_id) or just (id).
        if (existingRecord?.id) {
            payload.id = existingRecord.id;
        }

        // DEBUG: Log payload
        console.log('[History] Upserting payload:', JSON.stringify(payload));

        const { error: upsertError } = await supabaseAdmin
            .from('history')
            .upsert(payload, { onConflict: userId ? 'date, user_id' : 'date' });

        if (upsertError) {
            console.error('[History] Upsert error with Admin:', upsertError);

            // FALLBACK: Try with standard client if admin failed (maybe env var is missing?)
            // This is unlikely to work if RLS is strict, but worth a shot if the failure was due to bad admin key.
            if (upsertError.code === '401' || upsertError.message.includes('JWT')) {
                console.warn('[History] Falling back to anon client...');
                const { supabase } = await import('../supabase'); // Dynamic import to avoid circular dependency issues if any
                const { error: fallbackError } = await supabase
                    .from('history')
                    .upsert(payload, { onConflict: userId ? 'date, user_id' : 'date' });

                if (fallbackError) {
                    console.error('[History] Fallback failed:', fallbackError);
                    throw fallbackError;
                }
            } else {
                throw upsertError;
            }
        }

        console.info(`[History] Successfully saved ${filteredNewItems.length} new entries for ${dateStr} to Supabase.`);

    } catch (err: any) {
        console.error('[History] Supabase save operation failed FULL ERROR:', err);
    }
}