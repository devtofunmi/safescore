import { BetType } from '../schemas';

/**
 * Determines if a prediction was successful based on the final score.
 */
export function verifyPrediction(
    prediction: string,
    homeGoals: number,
    awayGoals: number
): 'Won' | 'Lost' {
    const totalGoals = homeGoals + awayGoals;

    switch (prediction) {
        case 'Home Team to Win':
            return homeGoals > awayGoals ? 'Won' : 'Lost';

        case 'Away Team to Win':
            return awayGoals > homeGoals ? 'Won' : 'Lost';

        case 'Draw':
            return homeGoals === awayGoals ? 'Won' : 'Lost';

        case 'Home Team to Win or Draw':
            return homeGoals >= awayGoals ? 'Won' : 'Lost';

        case 'Away Team to Win or Draw':
            return awayGoals >= homeGoals ? 'Won' : 'Lost';

        case 'Over 0.5 Goals':
            return totalGoals > 0.5 ? 'Won' : 'Lost';

        case 'Over 1.5 Goals':
            return totalGoals > 1.5 ? 'Won' : 'Lost';

        case 'Over 2.5 Goals':
            return totalGoals > 2.5 ? 'Won' : 'Lost';

        case 'Under 1.5 Goals':
            return totalGoals < 1.5 ? 'Won' : 'Lost';

        case 'Under 2.5 Goals':
            return totalGoals < 2.5 ? 'Won' : 'Lost';

        case 'Under 3.5 Goals':
            return totalGoals < 3.5 ? 'Won' : 'Lost';

        case 'Both Teams to Score: Yes':
            return (homeGoals > 0 && awayGoals > 0) ? 'Won' : 'Lost';

        case 'Both Teams to Score: No':
            return (homeGoals === 0 || awayGoals === 0) ? 'Won' : 'Lost';

        default:
            return 'Lost'; // Default for complex types like Handicap not yet implemented fully
    }
}
