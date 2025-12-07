import axios from 'axios';
import { cache, CACHE_DURATIONS } from '../cache';
import type { APIFixture } from './fetchFixtures';
import type { FullAPIFixture, TeamStats } from '../ai/types';

export type { FullAPIFixture };

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY;

interface StandingsData {
  standings?: Array<{
    table?: Array<{
      team: { id: number };
      position: number;
      form?: string;
      goalsFor: number;
      goalsAgainst: number;
      cleanSheet?: number;
    }>;
  }>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch and enrich fixtures with standings data
 * Uses caching to reduce API calls to standings endpoints
 */
export async function fetchExtendedFixtureData(
  fixtures: APIFixture[]
): Promise<FullAPIFixture[]> {
  const extendedFixtures: FullAPIFixture[] = [...fixtures];
  const leagueCodes = [...new Set(
    fixtures
      .map((f) => f.league?.code)
      .filter((code): code is string => code !== undefined && typeof code === 'string')
  )];

  const standingsCache: Map<string, StandingsData> = new Map();

  // Fetch standings for all leagues with rate limiting and retry logic
  const delayMs = 1500; // Increase delay to 1.5 seconds
  for (let i = 0; i < leagueCodes.length; i++) {
    const leagueCode = leagueCodes[i];
    const cacheKey = `standings:${leagueCode}`;

    // Check cache first
    const cached = cache.get<StandingsData>(cacheKey, CACHE_DURATIONS.STANDINGS);
    if (cached) {
      console.info(`Cache hit for standings: ${cacheKey}`);
      standingsCache.set(leagueCode, cached);
      continue;
    }

    // Add delay before each request (except the first)
    if (i > 0) {
      await sleep(delayMs);
    }

    let retries = 0;
    let success = false;
    
    while (retries < 3 && !success) {
      try {
        console.info(`Fetching standings for ${leagueCode} (attempt ${retries + 1}/3)`);
        const response = await axios.get<StandingsData>(
          `https://api.football-data.org/v4/competitions/${leagueCode}/standings`,
          {
            headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY },
            timeout: 5000,
          }
        );

        standingsCache.set(leagueCode, response.data);
        cache.set(cacheKey, response.data);
        console.info(`Fetched standings for ${leagueCode}`);
        success = true;
      } catch (err) {
        retries++;
        
        // Check if it's a rate limit error
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          if (retries < 3) {
            const waitTime = Math.min(1000 * Math.pow(2, retries - 1), 10000);
            console.warn(`[Rate Limited] 429 for ${leagueCode}. Waiting ${waitTime}ms before retry...`);
            await sleep(waitTime);
            continue;
          }
        }
        
        console.warn(
          `Could not fetch standings for ${leagueCode}:`,
          err instanceof Error ? err.message : String(err)
        );
        break;
      }
    }
  }

  if (standingsCache.size === 0) {
    console.warn('No standings data available, returning basic fixtures');
    return extendedFixtures;
  }

  // Attach stats to fixtures
  for (const fixture of extendedFixtures) {
    const leagueCode = fixture.league?.code;
    if (!leagueCode || !standingsCache.has(leagueCode)) continue;

    const standingsData = standingsCache.get(leagueCode);
    const table = standingsData?.standings?.[0]?.table;
    if (!table || !Array.isArray(table)) continue;

    const homeTeamStanding = table.find(
      (t) => t.team.id === fixture.teams.home.id
    );
    const awayTeamStanding = table.find(
      (t) => t.team.id === fixture.teams.away.id
    );

    const getTeamStats = (
      standing:
        | {
            team: { id: number };
            position: number;
            form?: string;
            goalsFor: number;
            goalsAgainst: number;
            cleanSheet?: number;
          }
        | undefined
    ): Partial<TeamStats> => {
      if (!standing) return {};
      return {
        form: standing.form,
        leagueRank: standing.position,
        goals: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        cleanSheets: standing.cleanSheet,
      };
    };

    fixture.stats = {
      homeTeam: getTeamStats(homeTeamStanding),
      awayTeam: getTeamStats(awayTeamStanding),
      h2h: { homeWins: 0, draws: 0, awayWins: 0 },
    };
  }

  return extendedFixtures;
}
