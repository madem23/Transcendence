import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from "passport-local";
import { AuthService } from '../auth.service';
import { Inject, UnauthorizedException } from '@nestjs/common';

export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
	constructor(
		@Inject('AUTH_SERVICE') private readonly authService: AuthService,
	) {
		super({
			usernameField: 'login',
			passwordField: 'password',
		});
	}

	async validate(login: string, password: string): Promise<any> {

		const userDB = await this.authService.validateUser(login, password);
		if (!userDB)
			throw new UnauthorizedException();
		return userDB;
	}
}