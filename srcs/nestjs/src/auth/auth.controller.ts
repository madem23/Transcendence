import { Controller, Get, Post, Req, Res, UseGuards, HttpCode, Inject } from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from './guards/LocalGuard';
import { JwtAuthGuard } from './guards/JwtAuthGuard';
import { AuthService } from 'src/auth/auth.service';
import RequestWithUser from '../utils/types';
import { UsersService } from '../users/users.service';
import { IntraAuthGuard } from './guards/IntraAuthGuard';
import { ConfigService } from '@nestjs/config';


@Controller('auth')
export class AuthController {
	constructor(
		@Inject('AUTH_SERVICE') private readonly authService: AuthService,
		@Inject('USER_SERVICE') private readonly userService: UsersService,
		private readonly configService: ConfigService,
	) { }

	/* 
	* /auth/redirect
	* This is the redirect URL (CALLBACK) the OAuth2 Provider (42) will call with a query parameter. */
	@UseGuards(IntraAuthGuard)
  @Get('code')
  async redirect(@Req() req: RequestWithUser, @Res({ passthrough: true }) response: Response) {
    try {
      const { user } = req;
      let redirectPath = '';

	  await this.userService.removeRefreshToken(req.user.id);
	  req.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());

      const accessCookie = this.authService.getCookieWithJwtAccessToken(user);
      const { refreshCookie, refreshToken } = this.authService.getCookieWithJwtRefreshToken(user);

      await this.userService.setCurrentRefreshToken(refreshToken, user.id);
      req.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);

      if (user.is2FAEnabled) {
        redirectPath = `http://${this.configService.get('HOST')}:${this.configService.get('PORT')}/2FAcode`;
      } else {
        redirectPath = `http://${this.configService.get('HOST')}:${this.configService.get('PORT')}/home`;
      }

      response.status(200).redirect(redirectPath);
    } catch (error) {
      response.status(500).send('Internal server error');
    }
  }


	/*/auth/local-login
	* This is the route the user will visit to authenticate via a chosen login and PW. */
	@HttpCode(200)
	@UseGuards(LocalAuthGuard)
	@Post('local-login')
	async logIn(@Req() request: RequestWithUser, @Res() response: Response) {
	  try {
		const { user } = request;

		await this.userService.removeRefreshToken(request.user.id);
		request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());

		const accessCookie = this.authService.getCookieWithJwtAccessToken(user);
		const { refreshCookie, refreshToken } = this.authService.getCookieWithJwtRefreshToken(user);
		await this.userService.setCurrentRefreshToken(refreshToken, user.id);
  
		request.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
  
		if (user.is2FAEnabled) {
		  return response.status(401).json({ redirect: '/2FAcode' });
		}
  
		user.password = undefined;
		return response.send(user);
	  } catch (error) {
		response.status(500).send('Internal server error');
	  }
	}

	/*
	* GET /auth/logout
	* Logout the user, kills the session. */
	@UseGuards(JwtAuthGuard)
	@Get('logout')
	async logOut(@Req() request: RequestWithUser) {
	  try {
		await this.userService.updateStatus(request.user.login, 'offline');
		await this.userService.removeRefreshToken(request.user.id);
		request.res.setHeader('Set-Cookie', this.authService.getCookiesForLogOut());
		this.userService.updateLogs(request.user.id, []);
	  } catch (error) {
		return { message: 'Internal server error' };
	  }
	}
}