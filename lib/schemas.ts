import { z } from 'zod';

/**
 * Allowed bet types for predictions
 * This list prevents AI hallucinations of invalid bet types
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


export const GeminiPredictionSchema = z.object({
  idx: z.number().optional(),
  team1: z.string().min(1),
  team2: z.string().min(1),
  betType: z.string().min(1),
  confidence: z.number().min(0).max(100),
  league: z.string().optional(),
  reason: z.string().optional(),
});

export type GeminiPredictionRaw = z.infer<typeof GeminiPredictionSchema>;

/**
 * Validated prediction returned to client
 */
export const PredictionSchema = z.object({
  id: z.string(),
  team1: z.string(),
  team2: z.string(),
  betType: z.enum(ALLOWED_BET_TYPES),
  confidence: z.number().min(0).max(100),
  league: z.string(),
  matchTime: z.string(),
  details: z.object({
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
 * API request validation
 */
export const PredictionsRequestSchema = z.object({
  oddsType: z.enum(['very safe', 'safe', 'medium safe']),
  leagues: z.array(z.string()).min(1),
  day: z.string().default('today'),
  oddsRange: z.string().optional(),
  date: z.string().optional(),
});

export type PredictionsRequest = z.infer<typeof PredictionsRequestSchema>;

/**
 * API response validation
 */
export const PredictionsResponseSchema = z.object({
  predictions: z.array(PredictionSchema),
  timestamp: z.string(),
  riskLevel: z.string(),
});

export type PredictionsResponse = z.infer<typeof PredictionsResponseSchema>;

/**
 * Error response
 */
export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;