import fs from 'fs';
import path from 'path';
import type { Prediction } from '../schemas';

/**
 * Path to the local JSON file used for historical data persistence.
 * In a production environment, this might be replaced with a database (e.g., PostgreSQL or Redis).
 */
const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');

/**
 * Interface representing a single historical prediction entry.
 */
export interface HistoryItem {
    id: string;               // Unique ID
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
 * Appends new predictions to the local history.json file.
 * Automatically handles date grouping and ensures no duplicate matches are saved for the same day.
 */
export async function saveToHistory(predictions: Prediction[], dateStr: string): Promise<void> {
    try {
        //  Load existing history
        let history: DailyRecord[] = [];
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            history = JSON.parse(data);
        }

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

        // Update the record for the specific date
        const dayIndex = history.findIndex(d => d.date === dateStr);

        if (dayIndex >= 0) {
            const existingItems = history[dayIndex].predictions;
            // Prevent duplicates (Matched by teams)
            const filteredNewItems = newItems.filter(newItem =>
                !existingItems.find(ex => ex.homeTeam === newItem.homeTeam && ex.awayTeam === newItem.awayTeam)
            );
            history[dayIndex].predictions = [...existingItems, ...filteredNewItems];
        } else {
            history.push({
                date: dateStr,
                predictions: newItems
            });
        }

        // Data Retention (Keep only the last 30 entries)
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (history.length > 30) {
            history = history.slice(0, 30);
        }

        // Commit changes to Disk
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        console.info(`[History] Successfully saved ${newItems.length} entries for ${dateStr}.`);

    } catch (err) {
        console.error('[History] Save operation failed:', err);
    }
}