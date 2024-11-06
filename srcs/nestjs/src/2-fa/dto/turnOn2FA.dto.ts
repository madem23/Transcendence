import { IsNotEmpty, IsString } from 'class-validator';

export class TwoFACodeDto {
	@IsNotEmpty()
	@IsString()
	twoFACode: string;
}