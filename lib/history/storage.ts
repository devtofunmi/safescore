import fs from 'fs';
import path from 'path';
import type { Prediction } from '../schemas';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');

export interface HistoryItem {
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    result: 'Won' | 'Lost' | 'Pending';
    score: string;
    league?: string;
    aiReasoning?: string;
}

export interface DailyRecord {
    date: string;
    predictions: HistoryItem[];
}

/**
 * Saves a batch of predictions to the history file.
 * Groups them by date.
 */
export async function saveToHistory(predictions: Prediction[], dateStr: string): Promise<void> {
    try {
        // 1. Read existing history
        let history: DailyRecord[] = [];
        if (fs.existsSync(HISTORY_FILE)) {
            const data = fs.readFileSync(HISTORY_FILE, 'utf8');
            history = JSON.parse(data);
        }

        // 2. Map new predictions to history format
        const newItems: HistoryItem[] = predictions.map(p => ({
            id: p.id,
            homeTeam: p.team1,
            awayTeam: p.team2,
            prediction: p.betType,
            result: 'Pending',
            score: '-',
            league: p.league,
            aiReasoning: p.details?.reasoning
        }));

        // 3. Find or create the record for this date
        const dayIndex = history.findIndex(d => d.date === dateStr);

        if (dayIndex >= 0) {
            // Avoid duplicates based on teams + date
            const existingItems = history[dayIndex].predictions;
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

        // 4. Keep only last 30 days to keep file size manageable
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (history.length > 30) {
            history = history.slice(0, 30);
        }

        // 5. Write back to file
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        console.info(`Saved ${newItems.length} predictions to history for ${dateStr}`);
    } catch (err) {
        console.error('Failed to save predictions to history:', err);
    }
}