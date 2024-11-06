import { IsNotEmpty } from "class-validator";

export class IntraLoginUserDto {

	@IsNotEmpty()
	login: string;

	@IsNotEmpty()
	image: {
		versions: {
			medium: string;
		};
	}
}
