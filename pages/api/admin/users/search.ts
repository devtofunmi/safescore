import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin User Search API
 * Search for users by email or ID
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

        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const foundUser = await getUserByIdentifier(q);
        if (!foundUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        const metadata = foundUser.user_metadata || {};
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
            id: foundUser.id,
            email: foundUser.email,
            createdAt: foundUser.created_at,
            planType: isPro ? 'pro' : 'free',
            proExpiresAt,
            trialExpiresAt,
            lastGenDate,
            genCount,
            metadata,
        });
    } catch (err: any) {
        console.error('[Admin User Search API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
