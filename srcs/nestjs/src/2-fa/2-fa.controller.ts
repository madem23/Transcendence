import { Controller, HttpCode, Post, Body, Res, Req, UseGuards, UnauthorizedException, Inject, Get } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { TwoFAService } from './2-fa.service';
import RequestWithUser from '../utils/types';
import { TwoFACodeDto } from './dto/turnOn2FA.dto';
import { InternalServerErrorException } from '@nestjs/common';

@Controller('2fa')
//@UseInterceptors(ClassSerializerInterceptor) SEE IF USEFULL
export class TwoFAController {
	constructor(
		@Inject('USER_SERVICE') private readonly userService: UsersService,
		@Inject('AUTH_SERVICE') private readonly authService: AuthService,
		private readonly twoFAService: TwoFAService,
	) { }

	/*
	* /2FA/generate
	* Once the user authenticated, they can receive a QR code to scan, containing the secret key
	*/
	@Post('generate')
	@UseGuards(JwtAuthGuard)
	async register(@Res() response: Response, @Req() request: RequestWithUser) {
		const { secret, otpauthUrl } = await this.twoFAService.generate2FASecret(request.user);

		return {
			secret: secret,
			qrcode: this.twoFAService.createQrCodeToStream(response, otpauthUrl),
		};
	}

	/*
	* User's code entered should be send to 2fa/turn-on
	*/
	@Post('turn-on')
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	async turnOnTwoFactorAuthentication(
	  @Req() request: RequestWithUser,
	  @Body() { twoFACode }: TwoFACodeDto,
	) {
	  try {
		const isCodeValid = this.twoFAService.is2FACodeValid(twoFACode, request.user);
  
		if (!isCodeValid) {
		  throw new UnauthorizedException('Wrong authentication code');
		}
  
		await this.userService.turnOn2FA(request.user.id); //MANON: UPDATE THE TOKEN WITH THE 2FA ACCESS
		const { user } = request;
		const accessCookie = this.authService.getCookieWithJwtAccessToken(user, true);
		const { refreshCookie, refreshToken } = this.authService.getCookieWithJwtRefreshToken(user, true);
		await this.userService.setCurrentRefreshToken(refreshToken, user.id);
		request.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
	  } catch (error) {

		if (error instanceof UnauthorizedException) {
		  throw error;
		}

		throw new InternalServerErrorException('Internal Server Error');
	  }
	}

	/*
	* routes that allows the user to send its OTP
	*/
	@Post('authenticate')
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	async authenticate(
	  @Req() request: RequestWithUser,
	  @Body() { twoFACode }: TwoFACodeDto,
	  @Res({ passthrough: true }) response: Response,
	) {
	  try {
		const isCodeValid = this.twoFAService.is2FACodeValid(twoFACode, request.user);
  
		if (!isCodeValid) {
		  return response.status(401).json({ message: 'Code 2FA invalide' });
		}
  
		const { user } = request;
		const accessCookie = this.authService.getCookieWithJwtAccessToken(user, true);
		const { refreshCookie, refreshToken } = this.authService.getCookieWithJwtRefreshToken(user, true);
		await this.userService.setCurrentRefreshToken(refreshToken, user.id);
  
		request.res.setHeader('Set-Cookie', [accessCookie, refreshCookie]);
  
		return response.status(200).json({ redirect: '/home' });
	  } catch (error) {
		return response.status(500).json({ message: 'Internal server error' });
	  }
	}

	/*
	* turning off the 2fa option
	*/
	@Get('turn-off')
	@HttpCode(200)
	@UseGuards(JwtAuthGuard)
	async turnOffTwoFactorAuthentication(
	  @Req() request: RequestWithUser,
	) {
	  try {
		await this.userService.turnOff2FA(request.user.id);
		return { success: true, message: '2FA turned off successfully' };
	  } catch (error) {
		return { success: false, message: 'Internal server error' };
	  }
	}


}
