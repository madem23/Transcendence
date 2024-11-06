import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { UsersService } from '../users/users.service';
import { User } from '../database/entities/user.entity';
import { toFileStream } from 'qrcode';
import { Response } from 'express';

@Injectable()
export class TwoFAService {
	constructor(
		@Inject('USER_SERVICE') private readonly usersService: UsersService,
		private readonly configService: ConfigService,
	) { }

	/*
	* Generates 2FA secret and URL for linking this app and the user's authenticator app
	*/
	public async generate2FASecret(user: User) {
		const secret = authenticator.generateSecret();

		const otpauthUrl = authenticator.keyuri(user.username, 'AUTH_APP_NAME', secret);

		await this.usersService.setTwoFASecret(secret, user.id);

		return {
			secret,
			otpauthUrl
		}
	}

	/*
	* Verify the code enter by the user after scanning the QRcode, thanks to the secret key stored
	*/
	public is2FACodeValid(twoFACode: string, user: User) {
		return authenticator.verify({
			token: twoFACode,
			secret: user.twoFASecret,
		});
	}


	public async createQrCodeToStream(stream: Response, otpauthUrl: string) {
		return toFileStream(stream, otpauthUrl);
	}

}
