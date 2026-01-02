import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';
import crypto from 'crypto';

// Disable body parsing to handle the raw body for signature verification
export const config = {
    api: {
        bodyParser: false,
    },
};

const getRawBody = async (readable: any) => {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        return res.status(200).json({
            status: 'active',
            message: 'SafeScore Coinbase Webhook is operational. Expected usage: POST only.'
        });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const signature = req.headers['x-cc-webhook-signature'] as string;
    const sharedSecret = process.env.COINBASE_WEBHOOK_SECRET;

    if (!signature || !sharedSecret) {
        console.error('[Coinbase Webhook] Missing signature or shared secret');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const rawBody = await getRawBody(req);

        // Verify Coinbase Signature
        const hash = crypto
            .createHmac('sha256', sharedSecret)
            .update(rawBody)
            .digest('hex');

        if (hash !== signature) {
            console.error('[Coinbase Webhook] Signature mismatch');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        const event = JSON.parse(rawBody.toString());
        const eventType = event.type;
        const data = event.data;

        console.log(`[Coinbase Webhook] Received event: ${eventType}`);

        // Logic for successful payment
        // Coinbase events: charge:confirmed, charge:resolved
        if (eventType === 'charge:confirmed' || eventType === 'charge:resolved') {
            const userId = data.metadata?.userId;

            if (userId) {
                console.log(`[Coinbase Webhook] Upgrading user ${userId} to Pro`);

                // Calculate expiration date (30 days from now)
                const expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + 30);

                const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    user_metadata: {
                        plan_type: 'pro',
                        pro_expires_at: expiresAt.toISOString()
                    }
                });

                if (error) {
                    console.error('[Coinbase Webhook] Supabase update error:', error);
                    return res.status(500).json({ error: 'Failed to update user' });
                }
            } else {
                console.warn('[Coinbase Webhook] No userId found in metadata');
            }
        }

        // Logic for failed/expired payment (Optional downgrade if you want to be strict)
        if (eventType === 'charge:failed') {
            const userId = data.metadata?.userId;
            if (userId) {
                console.log(`[Coinbase Webhook] Payment failed for user ${userId}`);
                // You might not want to downgrade immediately if they were already pro, 
                // but for a new charge it doesn't matter.
            }
        }

        return res.status(200).json({ received: true });
    } catch (err: any) {
        console.error('[Coinbase Webhook Error]:', err.message);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
