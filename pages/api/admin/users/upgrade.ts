import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin, getUserByIdentifier } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin Manual Pro Upgrade API
 * Manually upgrade a user to Pro plan
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

        const { userId, days = 30 } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Find user
        const targetUser = await getUserByIdentifier(userId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (typeof days === 'number' ? days : 30));

        // Update user metadata
        const metadata = targetUser.user_metadata || {};
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUser.id, {
            user_metadata: {
                ...metadata,
                plan_type: 'pro',
                pro_expires_at: expiresAt.toISOString(),
            }
        });

        if (updateError) {
            console.error('[Admin Upgrade] Update error:', updateError);
            return res.status(500).json({ error: 'Failed to upgrade user' });
        }

        return res.status(200).json({
            success: true,
            message: `User upgraded to Pro until ${expiresAt.toISOString()}`,
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err: any) {
        console.error('[Admin Upgrade API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
