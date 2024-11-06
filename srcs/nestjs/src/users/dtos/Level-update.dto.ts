
import { IsNumber, Validate } from 'class-validator';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// Check if the ratio Won/Total is a win
@ValidatorConstraint({ name: 'custom', async: false })
export class GamesWonValidator implements ValidatorConstraintInterface {
    validate(gamesWon: number, args: ValidationArguments) {
        const totalGames = (args.object as any).totalGames;

        if (totalGames % 2 === 0) {
            return gamesWon >= totalGames / 2 + 1;
        } else {
            return gamesWon > Math.floor(totalGames / 2);
        }
    }

    defaultMessage(args: ValidationArguments) {
        return 'Invalid gamesWon value for the given totalGames.';
    }
}

export class LevelUpdateDto {
    @IsNumber()
    @Validate(GamesWonValidator)
    gamesWon: number;

    @IsNumber()
    totalGames: number;
}
