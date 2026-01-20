import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Admin List Users API
 * Get paginated list of all users with filters
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

        const { page = '1', limit = '20', planType, search } = req.query;
        const pageNum = parseInt(page as string, 10);
        const limitNum = parseInt(limit as string, 10);
        const offset = (pageNum - 1) * limitNum;

        // Get all users
        const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

        if (usersError) {
            console.error('[Admin List Users] Error:', usersError);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }

        if (!usersData?.users) {
            return res.status(200).json({
                users: [],
                total: 0,
                page: pageNum,
                limit: limitNum,
            });
        }

        // Filter users
        let filteredUsers = usersData.users;

        // Filter by plan type
        if (planType && (planType === 'pro' || planType === 'free')) {
            filteredUsers = filteredUsers.filter((u) => {
                const metadata = u.user_metadata || {};
                const userPlanType = metadata.plan_type || 'free';
                const proExpiresAt = metadata.pro_expires_at;
                const trialExpiresAt = metadata.trial_expires_at;

                let isPro = false;
                if (userPlanType === 'pro' && proExpiresAt) {
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

                return planType === 'pro' ? isPro : !isPro;
            });
        }

        // Filter by search term (email)
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            filteredUsers = filteredUsers.filter((u) =>
                u.email?.toLowerCase().includes(searchLower)
            );
        }

        // Format users
        const formattedUsers = filteredUsers.map((u) => {
            const metadata = u.user_metadata || {};
            const userPlanType = metadata.plan_type || 'free';
            const proExpiresAt = metadata.pro_expires_at;
            const trialExpiresAt = metadata.trial_expires_at;

            let isPro = false;
            if (userPlanType === 'pro' && proExpiresAt) {
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

            return {
                id: u.id,
                email: u.email,
                createdAt: u.created_at,
                planType: isPro ? 'pro' : 'free',
                lastGenDate: metadata.last_gen_date,
                genCount: metadata.gen_count || 0,
            };
        });

        // Paginate
        const total = formattedUsers.length;
        const paginatedUsers = formattedUsers.slice(offset, offset + limitNum);

        return res.status(200).json({
            users: paginatedUsers,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
        });
    } catch (err: any) {
        console.error('[Admin List Users API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
