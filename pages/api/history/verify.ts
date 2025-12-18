import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { verifyPrediction } from '@/lib/history/verifier';
import { type DailyRecord, type HistoryItem } from '@/lib/history/storage';

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const HISTORY_FILE = path.join(process.cwd(), 'data', 'history.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).end();

    try {
        if (!fs.existsSync(HISTORY_FILE)) {
            return res.status(200).json({ message: 'No history to verify' });
        }

        const rawData = fs.readFileSync(HISTORY_FILE, 'utf8');
        const history: DailyRecord[] = JSON.parse(rawData);

        let updatedCount = 0;

        // We only verify the last 3 days to avoid blowing rate limits
        const daysToProcess = history.slice(0, 3);

        for (const day of daysToProcess) {
            const pendingItems = day.predictions.filter(p => p.result === 'Pending');
            if (pendingItems.length === 0) continue;

            // Group pending items by league to minimize API calls
            const leagues = [...new Set(pendingItems.map(p => p.league).filter(Boolean))];

            for (const leagueCode of leagues) {
                if (!leagueCode) continue;

                try {
                    console.info(`Verifying results for ${leagueCode} on ${day.date}`);
                    const response = await axios.get(
                        `https://api.football-data.org/v4/competitions/${leagueCode}/matches`,
                        {
                            params: { dateFrom: day.date, dateTo: day.date },
                            headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
                        }
                    );

                    const actualMatches = response.data?.matches || [];

                    day.predictions.forEach(p => {
                        if (p.result !== 'Pending' || p.league !== leagueCode) return;

                        // Find matching game by team names (since IDs might vary slightly across different API calls if not careful)
                        const match = actualMatches.find((m: any) =>
                            (m.homeTeam.name.includes(p.homeTeam) || p.homeTeam.includes(m.homeTeam.name)) &&
                            (m.awayTeam.name.includes(p.awayTeam) || p.awayTeam.includes(m.awayTeam.name))
                        );

                        if (match && match.status === 'FINISHED') {
                            const homeGoals = match.score.fullTime.home;
                            const awayGoals = match.score.fullTime.away;

                            if (homeGoals !== null && awayGoals !== null) {
                                p.result = verifyPrediction(p.prediction, homeGoals, awayGoals);
                                p.score = `${homeGoals}-${awayGoals}`;
                                updatedCount++;
                            }
                        } else if (match && (match.status === 'CANCELLED' || match.status === 'POSTPONED')) {
                            p.result = 'Lost'; // Or handle as void/refunded in a real app
                            p.score = match.status;
                            updatedCount++;
                        }
                    });

                    // Respect rate limit
                    await new Promise(r => setTimeout(r, 6000));

                } catch (err) {
                    console.error(`Failed to fetch results for ${leagueCode}:`, err);
                }
            }
        }

        if (updatedCount > 0) {
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        }

        res.status(200).json({ message: `Updated ${updatedCount} prediction outcomes.`, updatedCount });

    } catch (err) {
        console.error('Error verifying history:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
