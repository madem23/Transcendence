import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from "src/users/users.service";
import { TokenPayload } from "src/auth/tokenPayload.interface";
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly configService: ConfigService,
		@Inject('USER_SERVICE') private readonly userService: UsersService,
	) {
		super({ //we access the token, and decode the user id
			ignoreExpiration: false,
			jwtFromRequest: ExtractJwt.fromExtractors([(request: Request) => { //we read the token from the cookie
				return request?.cookies?.Authentication; //uses a custom extractor function that reads the token from the Authentication cookie.
			}]),
			secretOrKey: configService.get('JWT_ACCESS_TOKEN_SECRET')
		});
	}

	async validate(payload: TokenPayload) { //payload is now decoded from JWT token
		const userDB = await this.userService.findUserById(payload.sub);
		return { // === what will be saved in request.user
			...userDB
		}
	}
}