import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { runPredictionEngine } from '@/lib/ai/engine';
import { cache, CACHE_DURATIONS } from '@/lib/cache';

/**
 * Admin Generate Predictions for User API
 * Generate predictions on behalf of a user (bypasses quota)
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Get user from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Check if user is admin
        const adminCheck = await isAdmin(user.id);
        if (!adminCheck) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const { userId, oddsType, leagues, day, date } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        if (!oddsType || !['very safe', 'safe', 'medium safe'].includes(oddsType)) {
            return res.status(400).json({ error: 'Invalid oddsType. Must be: very safe, safe, or medium safe' });
        }

        if (!leagues || !Array.isArray(leagues) || leagues.length === 0) {
            return res.status(400).json({ error: 'leagues array is required' });
        }

        // Find target user
        const targetUser = await getUserByIdentifier(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check cache first
        const sortedLeagues = [...leagues].sort().join(',');
        const cacheKey = `api_result:${oddsType}:${sortedLeagues}:${day || 'today'}:${date || 'current'}`;
        const cachedResponse = cache.get<any>(cacheKey, CACHE_DURATIONS.FIXTURES);

        let predictions;
        if (cachedResponse && cachedResponse.predictions) {
            predictions = cachedResponse.predictions;
        } else {
            // Generate predictions
            predictions = await runPredictionEngine(
                { leagues, day: day || 'today', date },
                oddsType
            );

            if (!predictions || predictions.length === 0) {
                return res.status(404).json({ error: 'No predictions found for selected criteria.' });
            }
        }

        // Calculate reference date
        const now = new Date();
        const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));

        if (day === 'tomorrow') {
            utcNow.setDate(utcNow.getDate() + 1);
        } else if (day === 'weekend') {
            const dayOfWeek = utcNow.getDay();
            const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
            utcNow.setDate(utcNow.getDate() + (daysUntilSaturday === 0 ? 0 : daysUntilSaturday));
        }
        const referenceDate = date || utcNow.toISOString().split('T')[0];

        // Enrich and group predictions
        const predictionsByDate: Record<string, any[]> = {};
        const enrichedPredictions = predictions.map((p: any) => {
            let extractedDate = '';
            if (p.matchTime && p.matchTime.includes('-')) {
                extractedDate = p.matchTime.includes('T') ? p.matchTime.split('T')[0] : p.matchTime.split(' ')[0];
            }
            const actualDate = /^\d{4}-\d{2}-\d{2}$/.test(extractedDate) ? extractedDate : referenceDate;

            const enriched = {
                ...p,
                matchTime: p.matchTime.includes('-') ? p.matchTime : `${actualDate} ${p.matchTime}`,
            };

            if (!predictionsByDate[actualDate]) {
                predictionsByDate[actualDate] = [];
            }
            predictionsByDate[actualDate].push(enriched);

            return enriched;
        });

        // Save to history for the target user
        const { saveToHistory } = await import('@/lib/history/storage');
        const savePromises = Object.entries(predictionsByDate).map(async ([mDate, mPredictions]) => {
            if (mDate && /^\d{4}-\d{2}-\d{2}$/.test(mDate)) {
                try {
                    await saveToHistory(mPredictions, mDate, targetUser.id);
                } catch (err: any) {
                    console.error(`[Admin Generate] History persist failed for ${mDate}:`, err.message);
                }
            }
        });

        await Promise.all(savePromises);

        return res.status(200).json({
            success: true,
            predictions: enrichedPredictions,
            timestamp: new Date().toISOString(),
            riskLevel: oddsType,
            generatedFor: targetUser.email,
        });
    } catch (err: any) {
        console.error('[Admin Generate Predictions API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
