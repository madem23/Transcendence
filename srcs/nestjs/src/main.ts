import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
	dotenv.config(); // Load the .env file

	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	app.setGlobalPrefix('api');
	app.use(express.static(path.join(__dirname, '..', 'nextjs', 'build')));

	app.use(cookieParser());
	app.useGlobalPipes(new ValidationPipe());

	const configService = app.get(ConfigService);

	const address = '0.0.0.0';
	app.enableCors({
		origin: [`http://${configService.get('HOST')}:${configService.get('PORT')}`],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
	});

	await app.listen(configService.get('NESTJS_PORT'), address);
}
bootstrap();