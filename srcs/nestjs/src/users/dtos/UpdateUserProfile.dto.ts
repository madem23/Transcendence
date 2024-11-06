import { IsNotEmpty, IsString, ValidateIf, Length } from "class-validator";
import { Matches } from "class-validator";

export class UpdateUserProfileDto {
	@IsString()
	@IsNotEmpty()
	@ValidateIf((o) => o.username !== undefined)
	@Matches(/^[a-zA-Z0-9]+$/)
	@Length(1, 30, { message: 'Username should be between 1 and 30 characters' })
	username?: string;
	avatarData?: Buffer;
}
