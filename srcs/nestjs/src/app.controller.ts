import { Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { Controller, Get, UseGuards, HttpStatus, HttpException, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/JwtAuthGuard';
import RequestWithUser from 'src/utils/types';
import { configVariables } from './config-export';
import { ConfigService } from '@nestjs/config';


@Controller()
export class AppController {
	constructor() { }

	@Get('config')
	@UseGuards(JwtAuthGuard)
	async getConfig(@Req() req: RequestWithUser, @Res() res: Response) {
		try {

			const myConfigVariables = configVariables(new ConfigService());
			return res.status(HttpStatus.OK).json({ host: `${myConfigVariables.host}`, port: `${myConfigVariables.port}`, nestjsport: `${myConfigVariables.nestjs_port}` });

		} catch (error) {
			throw new HttpException('Something went wrong.', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}
}