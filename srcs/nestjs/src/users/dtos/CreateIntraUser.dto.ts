import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateIntraUserDto {
	@IsNotEmpty()
	@IsString()
	@Matches(/^[a-zA-Z0-9]+$/)
	@MinLength(1)
	login: string;
}

