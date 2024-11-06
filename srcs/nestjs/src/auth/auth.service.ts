import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { comparePasswords } from 'src/utils/bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from "src/auth/tokenPayload.interface";
import { IntraLoginUserDto } from '../users/dtos/IntraLoginUser.dto';
import RequestWithUser, { IntraUserParams } from '../utils/types'
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class AuthService {

	constructor(
		@Inject('USER_SERVICE') private readonly userService: UsersService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
	) { }


	async validateUser(login: string, password: string) {
		const userDB = await this.userService.findUserByLogin(login);

		if (userDB) {
			const matched = comparePasswords(password, userDB.password);
			if (matched) {
				userDB.password = undefined;
				return userDB
			}
			else {
				return null;
			}
		}
		return null;
	}

	/*
	* Called inside IntraAuthStrat: return user, creates one if non existing. */
	async validateUserByLogin(user: IntraLoginUserDto) {
		let existingUser = await this.userService.findUserByLogin(user.login);

		if (!existingUser) {
			const userParams: IntraUserParams = {
				login: user.login,
				avatarUrl: user.image.versions.medium,
			};
			return this.userService.createIntraUser(userParams);
		}
		return existingUser;
	}

	/* 
	* Generates an HTTP cookie containing a JWT (JSON Web Token) that holds the user info.
	* cookie is then sent to the client's browser, which will include it in subsequent HTTP requests to the server,
	allowing the server to identify and authenticate the user.
	* We can distinguish tokens created with and without 2FA
	*/
	public getCookieWithJwtAccessToken(user: any, is2FAuthenticated = false) {

		const payload: TokenPayload = { login: user.login, sub: user.id, is2FAuthenticated }; //defines what user info we put in the token

		const token = this.jwtService.sign(payload, {  //add the secret to the token and validates it
			secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
			expiresIn: `${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}s`
		}); //generates cookie
		return `Authentication=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}`; //constructs the cookie string
	}

	/*
	* We can distinguish tokens created with and without 2FA
	*/
	public getCookieWithJwtRefreshToken(user: any, is2FAuthenticated = false) {

		const payload: TokenPayload = { login: user.login, sub: user.id, is2FAuthenticated };
		const refreshToken = this.jwtService.sign(payload, { //add the secret to the token and validates it
			secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
			expiresIn: `${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}s`
		});
		const refreshCookie = `Refresh=${refreshToken}; HttpOnly; Path=/auth/refresh; Max-Age=${this.configService.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME')}`;

		return {
			refreshCookie,
			refreshToken
		}
	}

	public getCookiesForLogOut() {
		return [
			'Authentication=; HttpOnly; Path=/; Max-Age=0',
			'Refresh=; HttpOnly; Path=/; Max-Age=0'
		];
	}

	public async getRefreshAccessToken(request: RequestWithUser) {

		let decodedToken;

		try {
			const jwtToken = request.cookies.Authentication;
			decodedToken = jwt.verify(jwtToken, this.configService.get('JWT_ACCESS_TOKEN_SECRET'), {
				ignoreExpiration: true,
			}) as JwtPayload | TokenPayload;
		} catch (error) {
			await this.userService.removeRefreshToken(request.user.id);
			request.res.setHeader('Set-Cookie', this.getCookiesForLogOut());
			throw new Error(error.message);
		}

		const curTime = Math.floor(Date.now() / 1000);

		/**** Checks if the user has 2fa option enabled (if yes, checks if 2F-authenticated)*/
		const user = await this.userService.findUserById(decodedToken.sub);
		if (user && user.is2FAEnabled) {
			if (!decodedToken.is2FAuthenticated)
				throw new Error('User must be logged in through 2F-Authentication.');
		}

		if (decodedToken.exp - curTime < 60) {
			const accessTokenCookie = this.getCookieWithJwtAccessToken(decodedToken);
			return request.res.setHeader('Set-Cookie', accessTokenCookie);
		}
		return request.user;
	}
}

