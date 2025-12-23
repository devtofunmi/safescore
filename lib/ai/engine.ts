import { type Prediction } from '../schemas';

/**
 * The CORE SafeScore Engine Proxy.
 * In the Open Source version, this file acts as a bridge to your private analysis server.
 * 
 * IP PROTECTION:
 * The actual math, weights, and AI prompts are NOT stored here. They remain in your
 * private repository to prevent cloning of the core "SafeScore" algorithm.
 */
export async function runPredictionEngine(
    params: {
        leagues: string[];
        day: string;
        date?: string;
    },
    riskLevel: 'very safe' | 'safe' | 'medium safe'
): Promise<Prediction[]> {

    // 1. ATTEMPT REMOTE DELEGATION
    // This is the production path for the live app.
    const REMOTE_ENGINE_URL = process.env.CORE_ENGINE_URL;

    if (REMOTE_ENGINE_URL) {
        const baseUrl = REMOTE_ENGINE_URL.replace(/\/$/, '');
        console.info(`[Engine] Delegating data fetch and analysis to private server...`);
        try {
            const response = await fetch(`${baseUrl}/api/predict`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CORE_ENGINE_KEY || ''
                },
                body: JSON.stringify({ ...params, riskLevel })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Remote engine returned error: ${response.status} ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            return result.predictions as Prediction[];
        } catch (err) {
            console.error('[Engine] Remote delegation failed:', err);
        }
    }

    // 2. OPEN SOURCE FALLBACK
    // This allows the public code to "run" without crashing, but without the premium AI.
    console.warn('[Engine] No CORE_ENGINE_URL configured. Running in hollow mode.');

    // In a real open-source scenario, you could implement a very basic 
    // public version here, or just return empty results to encourage usage of the API.
    return [];
}

/**
 * Proxy for the result verification logic.
 * Ensures the historical verification logic stays private.
 */
export async function verifyHistoricalPredictions(): Promise<void> {
    const REMOTE_URL = process.env.CORE_ENGINE_URL;
    if (!REMOTE_URL) return;

    try {
        await fetch(`${REMOTE_URL}/api/verify-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CORE_ENGINE_KEY || ''
            }
        });
    } catch (e) {
        console.error('[Engine] History verification failed:', e);
    }
}