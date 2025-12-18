
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Load env variables
dotenv.config({ path: '.env.local' });

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const LEAGUES = ['PL', 'ELC', 'BL1', 'PD', 'FL1', 'SA', 'SA2', 'DED', 'PPL', 'TR1', 'GR1', 'SV1', 'CL', 'EL'];

// Simple file-based cache simulator for the script to match the app's cache
const CACHE_DIR = path.join(process.cwd(), '.next', 'cache', 'data-cache');

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function warmCache() {
    console.info('🚀 Starting SafeScore Cache Warmer...');

    if (!FOOTBALL_DATA_API_KEY) {
        console.error('❌ Error: FOOTBALL_DATA_API_KEY not found in .env.local');
        return;
    }

    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    for (let i = 0; i < LEAGUES.length; i++) {
        const league = LEAGUES[i];
        const cacheFilePath = path.join(CACHE_DIR, `standings_${league}.json`);

        console.info(`\n[${i + 1}/${LEAGUES.length}] Processing ${league}...`);

        // Check if we already have a fresh cache (less than 12 hours old)
        if (fs.existsSync(cacheFilePath)) {
            const stats = fs.statSync(cacheFilePath);
            const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
            if (ageHours < 12) {
                console.info(`✅ ${league} cache is still fresh (${Math.round(ageHours)}h old). Skipping.`);
                continue;
            }
        }

        try {
            console.info(`📡 Fetching fresh standings for ${league}...`);
            const response = await axios.get(
                `https://api.football-data.org/v4/competitions/${league}/standings`,
                { headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY } }
            );

            fs.writeFileSync(cacheFilePath, JSON.stringify(response.data));
            console.info(`💾 Saved ${league} data to disk cache.`);

            // Strict rate limit: 10 calls/minute = 6 seconds per call. We use 7s to be absolutely safe.
            if (i < LEAGUES.length - 1) {
                console.info('⏳ Waiting 7 seconds to respect API rate limits...');
                await sleep(7000);
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                console.warn('⚠️ Rate limited! Waiting 30 seconds before next league...');
                await sleep(30000);
                i--; // Retry this league
            } else if (err.response?.status === 404 || err.response?.status === 403) {
                console.error(`❌ ${league} not available on free plan or wrong code. Skipping.`);
            } else {
                console.error(`❌ Error fetching ${league}:`, err.message);
            }
        }
    }

    console.info('\n✨ Cache warming complete. Your first users will now experience instant loads!');
}

warmCache();
