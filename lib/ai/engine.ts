import { type Prediction } from '../schemas';

/**
 * runPredictionEngine
 * 
 * This is the bridge between the frontend and the prediction generation logic.
 * In production, it delegates to a private remote server containing the proprietary 
 * analysis algorithms. For open-source contributors, it provides a "hollow mode" 
 * fallback if no backend is configured.
 */
export async function runPredictionEngine(
    params: {
        leagues: string[];
        day: string;
        date?: string;
    },
    riskLevel: 'very safe' | 'safe' | 'medium safe'
): Promise<Prediction[]> {

    // Remote Delegation
    // If CORE_ENGINE_URL is set, we send the request to the private engine.
    const REMOTE_ENGINE_URL = process.env.CORE_ENGINE_URL;

    if (REMOTE_ENGINE_URL) {
        const baseUrl = REMOTE_ENGINE_URL.replace(/\/$/, '');
        console.info(`[Engine] Delegating prediction to private server...`);

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
                throw new Error(`Remote engine returned error: ${response.status}`);
            }

            const result = await response.json();
            return result.predictions as Prediction[];
        } catch (err) {
            console.error('[Engine] Remote delegation failed. Check CORE_ENGINE_URL or API key.', err);
        }
    }

    // Open Source Fallback (Hollow Mode)
    // Runs when no remote engine is configured. Prevents the app from crashing.
    console.warn('[Engine] No CORE_ENGINE_URL configured. Use this for UI testing only.');
    return [];
}