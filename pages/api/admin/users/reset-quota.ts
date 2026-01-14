import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Reset User Quota API
 * Reset a user's daily prediction generation quota
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

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Find user
        const targetUser = await getUserByIdentifier(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Reset quota by clearing last_gen_date and gen_count
        const metadata = targetUser.user_metadata || {};
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
            user_metadata: {
                ...metadata,
                last_gen_date: null,
                gen_count: 0,
            }
        });

        if (updateError) {
            console.error('[Admin Reset Quota] Update error:', updateError);
            return res.status(500).json({ error: 'Failed to reset quota' });
        }

        return res.status(200).json({
            success: true,
            message: 'User quota reset successfully',
        });
    } catch (err: any) {
        console.error('[Admin Reset Quota API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
