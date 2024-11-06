import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from "src/users/users.service";
import { TokenPayload } from "src/auth/tokenPayload.interface";
import { Request } from 'express';

@Injectable()
export class JwtRefreshTKStrategy extends PassportStrategy(Strategy, 'jwt-refresh-token') {
	constructor(
		private readonly configService: ConfigService,
		@Inject('USER_SERVICE') private readonly userService: UsersService,
	) {
		super({ //we access the token, and decode the user id
			ignoreExpiration: false,
			jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => { //we read the token from the cookie
				return request?.cookies?.Refresh; //uses a custom extractor function that reads the token from the Authentication cookie.
			}]),
			secretOrKey: configService.get('JWT_REFRESH_TOKEN_SECRET'),
			passReqToCallback: true, //therefore, request object is passed as the first argument to the strategy's verify function (to extract the JWT token)
		});
	}

	async validate(request: Request, payload: TokenPayload) { //payload is now decoded from JWT token
		const refreshToken = request.cookies?.Refresh;
		return this.userService.getUserIfRefreshTokenMatches(refreshToken, payload.sub);
	}
}