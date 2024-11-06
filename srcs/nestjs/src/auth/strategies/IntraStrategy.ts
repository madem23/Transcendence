import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from "../auth.service";
import { HttpService } from '@nestjs/axios';
import axios from 'axios';

@Injectable()
export class IntraStrategy extends PassportStrategy(Strategy, 'intra') {
	constructor(@Inject(
		'AUTH_SERVICE') private readonly authService: AuthService,
		private readonly httpService: HttpService,
	) {
		super({
			authorizationURL: process.env.INTRA_AUTH_URL,
			tokenURL: process.env.INTRA_TOKEN_URL,
			clientID: process.env.INTRA_CLIENT_ID,
			clientSecret: process.env.INTRA_SECRET,
			callbackURL: process.env.INTRA_CALLBACK_URL,
			scope: "public",
			profileFields: {
				username: function (obj: { username: string }) {
					return String(obj.username);
				},
			},
		});
	}

	/*
	*	Once the code from API42 received, uses it to receive user information.
	*/
	async validate(accessToken: string, done): Promise<any> {

		const response = await axios.get('https://api.intra.42.fr/v2/me', {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const data = response.data;

		const user = await this.authService.validateUserByLogin(data);

		return user;
	}
}