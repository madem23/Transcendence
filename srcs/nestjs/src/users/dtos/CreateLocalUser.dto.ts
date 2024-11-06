import { IsNotEmpty, IsString, Matches, Length } from "class-validator";

export class CreateLocalUserDto {

	@IsNotEmpty()
	@IsString()
	@Matches(/^[a-zA-Z0-9]+$/)
	@Length(1, 30, { message: 'Username should be between 1 and 30 characters' })
	password: string;

	@IsNotEmpty()
	@IsString()
	login: string;
}

