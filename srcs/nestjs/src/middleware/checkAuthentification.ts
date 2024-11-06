import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { Req } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import RequestWithUser from 'src/utils/types';
import { User } from 'src/database/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ValidateCustomerMiddleware implements
	NestMiddleware {

	constructor(
		@InjectRepository(User) private userRepository: Repository<User>,
		private readonly authService: AuthService,
	) { }


	async use(@Req() req: RequestWithUser, res: Response, next: NextFunction) {

		const excludedPaths = [
			'/api/users/local-register',
			'/api/auth/local-login',
			'/api/auth',
			'/api/auth/code',
			'/api/auth/logout',
			'/api/auth/2fa/turn-on',
			'/api/2fa/authenticate',
		];

		try {
			await this.authService.getRefreshAccessToken(req);
		} catch (error) {
			if (!excludedPaths.includes(req.path))
				return res.status(401).json({ error: error.toString(), message: 'Unauthorized' })
		}

		next();
	}
}
