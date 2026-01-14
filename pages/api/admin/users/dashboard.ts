import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Get User Dashboard Data API
 * Get dashboard statistics and active predictions for a specific user
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
            console.error('[Admin User Dashboard] History error:', historyError);
        }

        // Calculate stats
        const now = new Date();
        const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        let todayCount = 0;
        let avgConfidence = 0;
        const leagues = new Set<string>();
        const activePredictions: any[] = [];

        if (historyData) {
            historyData.forEach((record: any) => {
                if (record.predictions && Array.isArray(record.predictions)) {
                    record.predictions.forEach((p: any) => {
                        // Only count user's own predictions
                        if (p.userId === targetUser.id) {
                            if (p.league) leagues.add(p.league);

                            // Count today's predictions
                            if (record.date === todayLocalStr) {
                                todayCount++;
                            }

                            // Collect pending predictions
                            if (p.result === 'Pending' || !p.result) {
                                activePredictions.push({
                                    ...p,
                                    team1: p.homeTeam || p.team1,
                                    team2: p.awayTeam || p.team2,
                                    betType: p.prediction || p.betType,
                                    confidence: p.confidence || 75,
                                    league: p.league,
                                    displayDate: record.date,
                                });
                            }

                            // Calculate average confidence
                            if (p.confidence) {
                                avgConfidence += p.confidence;
                            }
                        }
                    });
                }
            });

            if (activePredictions.length > 0) {
                avgConfidence = Math.round(avgConfidence / activePredictions.length);
            }
        }

        // Get user metadata
        const metadata = targetUser.user_metadata || {};
        const planType = metadata.plan_type || 'free';
        const proExpiresAt = metadata.pro_expires_at;
        const trialExpiresAt = metadata.trial_expires_at;
        const lastGenDate = metadata.last_gen_date;
        const genCount = metadata.gen_count || 0;

        // Determine if user is Pro
        let isPro = false;
        if (planType === 'pro' && proExpiresAt) {
            const expDate = new Date(proExpiresAt);
            if (expDate > new Date()) {
                isPro = true;
            }
        }
        if (!isPro && trialExpiresAt) {
            const trialDate = new Date(trialExpiresAt);
            if (trialDate > new Date()) {
                isPro = true;
            }
        }

        return res.status(200).json({
            user: {
                id: targetUser.id,
                email: targetUser.email,
                createdAt: targetUser.created_at,
                planType: isPro ? 'pro' : 'free',
                proExpiresAt,
                trialExpiresAt,
                lastGenDate,
                genCount,
            },
            stats: {
                todayCount,
                avgConfidence: avgConfidence || 0,
                markets: leagues.size,
                activePredictions: activePredictions.length,
            },
            activePredictions: activePredictions.slice(0, 10), // Limit to 10
        });
    } catch (err: any) {
        console.error('[Admin User Dashboard API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
