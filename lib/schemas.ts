import { z } from 'zod';

/**
 * Valid Betting Markets
 * 
 * This list represents the only allow outcomes the AI is permitted to predict.
 * Ensures data consistency between the backend engine and the UI.
 */
export const ALLOWED_BET_TYPES = [
  'Home Team to Win or Draw',
  'Away Team to Win or Draw',
  'Home Team to Win',
  'Away Team to Win',
  'Draw',
  'Over 0.5 Goals',
  'Over 1.5 Goals',
  'Over 2.5 Goals',
  'Under 1.5 Goals',
  'Under 2.5 Goals',
  'Under 3.5 Goals',
  'Both Teams to Score: Yes',
  'Both Teams to Score: No',
  'Highest Scoring Half: 1st',
  'Highest Scoring Half: 2nd',
  'Handicap (-1.5) Home Team',
  'Handicap (+1.5) Away Team',
  'Home Team to Score in 1st Half: Yes',
  'Away Team to Score in 2nd Half: Yes',
  'Team to Score: Home',
  'Team to Score: Away',
  'No Pick',
] as const;

export type BetType = (typeof ALLOWED_BET_TYPES)[number];

/**
 * Prediction Schema
 * 
 * Defines the structure of a single prediction object.
 * Used for runtime validation of data incoming from the Core Engine.
 */
export const PredictionSchema = z.object({
  id: z.string(),                  // Primary identifier (Expected format: pred-{matchId}-{timestamp}-{index})
  team1: z.string(),               // Home team name
  team2: z.string(),               // Away team name
  betType: z.enum(ALLOWED_BET_TYPES),
  confidence: z.number().min(0).max(100),
  league: z.string(),
  matchTime: z.string(),           // Match start time
  matchId: z.number().optional(),  // Optional explicit match ID
  details: z.object({              // Pre-match statistical analysis
    team1Form: z.string(),
    team2Form: z.string(),
    team1Stats: z.object({
      goalsFor: z.number(),
      goalsAgainst: z.number(),
    }),
    team2Stats: z.object({
      goalsFor: z.number(),
      goalsAgainst: z.number(),
    }),
    h2h: z.object({
      homeWins: z.number(),
      awayWins: z.number(),
      draws: z.number(),
    }),
    reasoning: z.string().optional(),
  }).optional(),
});

export type Prediction = z.infer<typeof PredictionSchema>;

/**
 * Request Schema: /api/predictions
 */
export const PredictionsRequestSchema = z.object({
  oddsType: z.enum(['very safe', 'safe', 'medium safe']),
  leagues: z.array(z.string()).min(1),
  day: z.string().default('today'),
  oddsRange: z.string().optional(),
  date: z.string().optional(),
  userId: z.string().optional(),
});

export type PredictionsRequest = z.infer<typeof PredictionsRequestSchema>;

/**
 * Response Schema: /api/predictions
 */
export const PredictionsResponseSchema = z.object({
  predictions: z.array(PredictionSchema),
  timestamp: z.string(),
  riskLevel: z.string(),
});

export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;

/**
 * Standard Error Response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;