import { IsNotEmpty } from "class-validator";

export class LoginDto {

	@IsNotEmpty()
	login: string;

}

export class UsernameDto {

	@IsNotEmpty()
	username: string;

}

export class MatchDto {
	@IsNotEmpty()
	opponentLogin: string;

	@IsNotEmpty()
	opponentScore: number;

	@IsNotEmpty()
	userScore: number;
}

export class AchievementDto {
	@IsNotEmpty()
	achievementName: string[];
}

/*export class AchievementObjDto {
	@IsNotEmpty()
	title: string;
	@IsNotEmpty()
	message: string;
	@IsNotEmpty()
	link: string;
	@IsNotEmpty()
	type: string;
}*/
