import { IsNotEmpty, IsString, Length, Matches, ValidateIf } from "class-validator";

export class CreateRoomDto {
	@IsString()
	@Matches(/^[a-zA-Z0-9\S\p{Emoji}]+$/u)
	@IsNotEmpty()
	@Length(1, 30, { message: 'RoomName should be between 1 and 30 characters' })
	name: string;

	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9]+$/)
	@Length(1, 30, { message: 'Password should be between 1 and 30 characters' })
	@IsString()
	@ValidateIf((object, value) => object.type === 'protected')
	password: string;

	@IsNotEmpty()
	type: string;
}