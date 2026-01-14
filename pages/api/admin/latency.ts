import type { NextApiRequest, NextApiResponse } from 'next';
import { isAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { runPredictionEngine } from '@/lib/ai/engine';

/**
 * Admin Latency API
 * Test prediction engine latency
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

        // Test engine latency with a small request
        const startTime = Date.now();
        try {
            await runPredictionEngine(
                { leagues: ['Premier League'], day: 'today' },
                'safe'
            );
            const latency = Date.now() - startTime;

            return res.status(200).json({
                latency,
                unit: 'ms',
                status: latency < 5000 ? 'healthy' : latency < 10000 ? 'slow' : 'degraded',
            });
        } catch (engineError: any) {
            const latency = Date.now() - startTime;
            return res.status(200).json({
                latency,
                unit: 'ms',
                status: 'error',
                error: engineError.message || 'Engine error',
            });
        }
    } catch (err: any) {
        console.error('[Admin Latency API] Error:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
