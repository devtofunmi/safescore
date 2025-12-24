import { supabase } from '../supabase';
import type { Prediction } from '../schemas';

/**
 * Interface representing a single historical prediction entry.
 */
export interface HistoryItem {
    id: string;               // Unique ID (Format: pred-{matchId}-{timestamp}-{index})
    homeTeam: string;
    awayTeam: string;
    prediction: string;      // The bet type selected
    result: 'Won' | 'Lost' | 'Pending';
    score: string;           // Final score (e.g., "2-1")
    league?: string;
}

/**
 * Interface representing a group of predictions for a specific date.
 */
export interface DailyRecord {
    date: string;            // Format: YYYY-MM-DD
    predictions: HistoryItem[];
}

/**
 * saveToHistory
 * 
 * Persists predictions to Supabase.
 * Groups them by date and merges with any existing records for that day.
 */
export async function saveToHistory(predictions: Prediction[], dateStr: string): Promise<void> {
    try {
        // Fetch existing record for this date from Supabase
        const { data: existingRecord, error: fetchError } = await supabase
            .from('history')
            .select('*')
            .eq('date', dateStr)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means not found
            throw fetchError;
        }

        const existingPredictions: HistoryItem[] = existingRecord?.predictions || [];

        // Map incoming predictions to HistoryItem format
        const newItems: HistoryItem[] = predictions.map(p => ({
            id: p.id,
            homeTeam: p.team1,
            awayTeam: p.team2,
            prediction: p.betType,
            result: 'Pending',
            score: '-',
            league: p.league
        }));

        // Merge and avoid duplicates (Matched by teams)
        const filteredNewItems = newItems.filter(newItem =>
            !existingPredictions.find(ex => ex.homeTeam === newItem.homeTeam && ex.awayTeam === newItem.awayTeam)
        );

        const updatedPredictions = [...existingPredictions, ...filteredNewItems];

        // Upsert into Supabase
        const { error: upsertError } = await supabase
            .from('history')
            .upsert({
                date: dateStr,
                predictions: updatedPredictions
            }, { onConflict: 'date' });

        if (upsertError) throw upsertError;

        console.info(`[History] Successfully saved ${newItems.length} entries for ${dateStr} to Supabase.`);

    } catch (err) {
        console.error('[History] Supabase save operation failed:', err);
    }
}