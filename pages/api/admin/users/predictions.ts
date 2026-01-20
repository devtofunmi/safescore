import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Get User Predictions API
 * Get all predictions (results) for a specific user
 */
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
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

        const { userId, limit = 50 } = req.query;
        if (!userId || typeof userId !== 'string') {
            return res.status(400).json({ error: 'userId query parameter is required' });
        }

        // Find target user
        const targetUser = await getUserByIdentifier(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user's history
        const { data: historyData, error: historyError } = await supabaseAdmin
            .from('history')
            .select('*')
            .eq('user_id', targetUser.id)
            .order('date', { ascending: false });

        if (historyError) {
            console.error('[Admin User Predictions] History error:', historyError);
            return res.status(500).json({ error: 'Failed to fetch predictions' });
        }

        // Flatten all predictions
        const allPredictions: any[] = [];
        if (historyData) {
            historyData.forEach((record: any) => {
                if (record.predictions && Array.isArray(record.predictions)) {
                    record.predictions.forEach((p: any) => {
                        if (p.userId === targetUser.id) {
                            allPredictions.push({
                                ...p,
                                team1: p.homeTeam || p.team1,
                                team2: p.awayTeam || p.team2,
                                betType: p.prediction || p.betType,
                                confidence: p.confidence || 75,
                                league: p.league,
                                date: record.date,
                            });
                        }
                    });
                }
            });
        }

        // Sort by date (newest first) and limit
        const sortedPredictions = allPredictions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, parseInt(limit as string, 10));

        return res.status(200).json({
            count: allPredictions.length,
            predictions: sortedPredictions,
        });
    } catch (err: any) {
        console.error('[Admin User Predictions API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
