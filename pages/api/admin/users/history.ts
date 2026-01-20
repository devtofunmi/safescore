import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Get User History API
 * Get match history for a specific user (similar to previous-matches page)
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

        const { userId } = req.query;
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
            console.error('[Admin User History] History error:', historyError);
            return res.status(500).json({ error: 'Failed to fetch history' });
        }

        // Calculate overall stats
        let total = 0;
        let won = 0;
        let lost = 0;
        let pending = 0;
        let postponed = 0;

        const formattedHistory = (historyData || []).map((record: any) => {
            const userPredictions = (record.predictions || []).filter((p: any) => p.userId === targetUser.id);
            
            userPredictions.forEach((p: any) => {
                total++;
                if (p.result === 'Won') won++;
                else if (p.result === 'Lost') lost++;
                else if (p.result === 'Postponed') postponed++;
                else pending++;
            });

            return {
                date: record.date,
                predictions: userPredictions.map((p: any) => ({
                    id: p.id,
                    homeTeam: p.homeTeam || p.team1,
                    awayTeam: p.awayTeam || p.team2,
                    prediction: p.prediction || p.betType,
                    result: p.result || 'Pending',
                    score: p.score || '-',
                    league: p.league,
                })),
            };
        }).filter((day: any) => day.predictions.length > 0);

        const activeCount = total - pending - postponed;
        const accuracy = activeCount > 0 ? Math.round((won / activeCount) * 100) : 0;

        return res.status(200).json({
            user: {
                id: targetUser.id,
                email: targetUser.email,
            },
            stats: {
                total,
                won,
                lost,
                pending,
                postponed,
                accuracy,
            },
            history: formattedHistory,
        });
    } catch (err: any) {
        console.error('[Admin User History API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
