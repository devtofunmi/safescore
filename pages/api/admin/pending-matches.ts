import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getPendingMatches } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Pending Matches API
 * Get all matches stuck in "Pending" status
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

        const pendingMatches = await getPendingMatches();

        return res.status(200).json({
            count: pendingMatches.length,
            matches: pendingMatches,
        });
    } catch (err: any) {
        console.error('[Admin Pending Matches API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
