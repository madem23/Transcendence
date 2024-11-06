import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '../tokenPayload.interface';

@Injectable()
export class Jwt2faStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
	constructor(
		@Inject('USER_SERVICE') private readonly userService: UsersService,
		private readonly configService: ConfigService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => {
				return request?.cookies?.Authentication; //does the authentication cookie exists in the request cookies? if yes: it is the JWT token, so return it.
			}]),
			secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET')
		});
	}

	async validate(payload: TokenPayload) {
		const user = await this.userService.findUserById(payload.sub);

		if (!user.is2FAEnabled) {
			return user;
		}
		if (payload.is2FAuthenticated) {
			return user;
		}
	}
}