
import axios from 'axios';
import * as cheerio from 'cheerio';
import { FootballDataMatch } from './verifier';

/**
 * Scrapes BBC Sport for match results on a specific date.
 * Returns a list of standardized 'FootballDataMatch' objects for compatibility.
 */

export async function scrapeBBCMatches(date: string): Promise<FootballDataMatch[]> {
    try {
        // BBC Date format: YYYY-MM-DD (e.g., 2026-01-01)
        const url = `https://www.bbc.com/sport/football/scores-fixtures/${date}`;
        console.log(`[Scraper] Fetching ${url}`);

        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const matches: FootballDataMatch[] = [];

        // BBC structure varies, but generally matches are in "group" containers or list items.
        // search for elements that contain team names and scores.
        // Identify semantic containers for matches.

        // Strategy: Look for the specific "qa-match-block" or similar components.
        // As of 2025/26, BBC might use new classes.  try generic selectors first.

        // BBC structure varies. We look for common match containers like GridContainer, Match- row list items, etc.
        const containers = $('div[class*="GridContainer"], li[class*="Match-"], div[class*="Match-"]');

        containers.each((_, el) => {
            const $el = $(el);

            // Skip if it doesn't look like a match row (needs at least one team)
            if ($el.find('div[class*="TeamHome"], [data-testid="home-team-name"]').length === 0) return;

            // Extract Teams
            // BBC includes multiple spans for responsiveness. Prefer DesktopValue if present.
            const homeSpan = $el.find('div[class*="TeamHome"] span[class*="DesktopValue"], [data-testid="home-team-name"]').first();
            const awaySpan = $el.find('div[class*="TeamAway"] span[class*="DesktopValue"], [data-testid="away-team-name"]').first();

            let homeTeamName = homeSpan.text().trim();
            let awayTeamName = awaySpan.text().trim();

            // Handle BBC's multiple spans (Mobile/Desktop/Screenreader) which create duplicate text
            if (homeTeamName.includes('\n')) homeTeamName = homeTeamName.split('\n')[0].trim();
            if (awayTeamName.includes('\n')) awayTeamName = awayTeamName.split('\n')[0].trim();

            // Fallback: If spans still empty, try the parent container
            if (!homeTeamName) {
                const rawHome = $el.find('div[class*="TeamHome"]').text().trim();
                homeTeamName = rawHome.split('\n')[0].trim();
            }
            if (!awayTeamName) {
                const rawAway = $el.find('div[class*="TeamAway"]').text().trim();
                awayTeamName = rawAway.split('\n')[0].trim();
            }

            if (!homeTeamName || !awayTeamName) return;

            // Extract Score
            const homeScoreText = $el.find('div[class*="HomeScore"], [data-testid="home-score"]').first().text().trim();
            const awayScoreText = $el.find('div[class*="AwayScore"], [data-testid="away-score"]').first().text().trim();

            const homeScore = parseInt(homeScoreText);
            const awayScore = parseInt(awayScoreText);

            // Match Status
            const $statusEl = $el.find('div[class*="StyledPeriod"], div[class*="Status"], div[class*="MatchProgress"]');
            const statusText = $statusEl.text().trim().toUpperCase();
            let status = 'SCHEDULED';

            if (!isNaN(homeScore) && !isNaN(awayScore)) {
                status = 'FINISHED';
                // Check for explicit finished status
                if (statusText.includes('FT') || statusText.includes('FINISHED') || statusText.includes('FULL TIME')) {
                    status = 'FINISHED';
                } else if (statusText.includes('LIVE') || statusText.includes('MINS') || statusText.includes('\'')) {
                    status = 'IN_PLAY';
                }
            } else if (statusText.includes('POSTP') || statusText.includes('CANC')) {
                status = 'CANCELLED';
            }

            const id = Math.abs((homeTeamName + awayTeamName).split('').reduce((a, b) => a = ((a << 5) - a) + b.charCodeAt(0) | 0, 0));

            matches.push({
                id: id,
                utcDate: date,
                status: status,
                score: {
                    winner: homeScore > awayScore ? 'HOME_TEAM' : awayScore > homeScore ? 'AWAY_TEAM' : 'DRAW',
                    duration: 'REGULAR',
                    fullTime: { home: isNaN(homeScore) ? null : homeScore, away: isNaN(awayScore) ? null : awayScore },
                    halfTime: { home: null, away: null }
                },
                homeTeam: { id: 0, name: homeTeamName },
                awayTeam: { id: 0, name: awayTeamName }
            });
        });

        // FALLBACK: Parse text-based "versus" patterns if DOM structure failed
        if (matches.length === 0) {
            console.log("[Scraper] DOM selectors failed, trying text pattern fallback...");
            // Look for "Team A versus Team B" patterns
            const text = $('body').text();
            // This is a very complex regex because BBC text is often jumbled in the DOM-to-text conversion

            $('a, li, div').each((_, el) => {
                const elText = $(el).text();
                if (elText.includes(' versus ') && (elText.includes('FT') || elText.match(/\d+-\d+/))) {
                    // Try to extract: "Home Team versus Away Team"
                    const parts = elText.split(' versus ');
                    if (parts.length >= 2) {
                        const home = parts[0].trim().split(/\s{2,}/).pop() || ''; // Get last few words
                        const rest = parts[1].trim();
                        // Rest likely contains Away Team and Score
                        // Example: "Watford FT1 - 2"
                        const matchScore = rest.match(/(\d+)\s*-\s*(\d+)/) || rest.match(/FT\s*(\d+)\s*(\d+)/);
                        if (matchScore) {
                            const away = rest.split(matchScore[0])[0].trim();
                            const hScore = parseInt(matchScore[1]);
                            const aScore = parseInt(matchScore[2]);

                            if (home && away && !isNaN(hScore) && !isNaN(aScore)) {
                                const id = Math.abs((home + away).split('').reduce((a, b) => a = ((a << 5) - a) + b.charCodeAt(0) | 0, 0));
                                matches.push({
                                    id,
                                    utcDate: date,
                                    status: 'FINISHED',
                                    score: {
                                        winner: hScore > aScore ? 'HOME_TEAM' : aScore > hScore ? 'AWAY_TEAM' : 'DRAW',
                                        duration: 'REGULAR',
                                        fullTime: { home: hScore, away: aScore },
                                        halfTime: { home: null, away: null }
                                    },
                                    homeTeam: { id: 0, name: home },
                                    awayTeam: { id: 0, name: away }
                                });
                            }
                        }
                    }
                }
            });
        }

        console.log(`[Scraper] Found ${matches.length} matches on BBC for ${date}`);
        return matches;

    } catch (error: any) {
        console.error(`[Scraper] Failed to scrape ${date}: ${error.message}`);
        return [];
    }
}