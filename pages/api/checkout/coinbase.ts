import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const COINBASE_API_KEY = process.env.COINBASE_API_KEY;

    if (!COINBASE_API_KEY) {
        console.error('[Coinbase] Missing API Key');
        return res.status(500).json({ error: 'Coinbase integration not configured' });
    }

    try {
        const response = await fetch('https://api.commerce.coinbase.com/charges', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CC-Api-Key': COINBASE_API_KEY,
                'X-CC-Version': '2018-03-22',
            },
            body: JSON.stringify({
                name: 'SafeScore Pro',
                description: 'Premium High-Confidence Football Predictions (1 Month)',
                pricing_type: 'fixed_price',
                local_price: {
                    amount: '3.45',
                    currency: 'USD',
                },
                metadata: {
                    userId: userId,
                },
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://safescore.pro'}/dashboard?status=success`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://safescore.pro'}/pricing`,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to create charge');
        }

        // Redirect user to Coinbase checkout page
        return res.redirect(data.data.hosted_url);
    } catch (error: any) {
        console.error('[Coinbase Checkout Error]:', error);
        return res.status(500).json({ error: error.message });
    }
}
