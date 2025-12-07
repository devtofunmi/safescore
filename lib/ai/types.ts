import type { APIFixture } from '../football/fetchFixtures';

export interface TeamStats {
  form?: string;
  leagueRank: number;
  goals: number;
  goalsAgainst: number;
  cleanSheets?: number;
}

export interface MatchStats {
  h2h: {
    homeWins: number;
    draws: number;
    awayWins: number;
  };
  homeTeam: Partial<TeamStats>;
  awayTeam: Partial<TeamStats>;
}

export type FullAPIFixture = APIFixture & {
  stats?: MatchStats;
};
