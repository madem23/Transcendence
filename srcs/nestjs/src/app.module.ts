import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule } from '@nestjs/config';
import { User } from './database/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import * as Joi from 'joi';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { ValidateCustomerMiddleware } from './middleware/checkAuthentification';
import { UsersController } from './users/users.controller';
import { GatewayModule } from './gateway/gateway.module';
import { TwoFAModule } from './2-fa/2-fa.module';
import { RoomModule } from './room/room.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { TwoFAService } from './2-fa/2-fa.service';
import { RoomController } from './room/controllers/room.controller';
import { TwoFAController } from './2-fa/2-fa.controller';
import { Room } from './database/entities/room.entity';

@Module({
	imports: [
		ConfigModule.forRoot({
			validationSchema: Joi.object({
				PGHOST: Joi.string().required(),
				PGPORT: Joi.number().required(),
				PGUSER: Joi.string().required(),
				POSTGRES_PASSWORD: Joi.string().required(),
				PGPASSWORD: Joi.string().required(),
				PGDATABASE: Joi.string().required(),
				NESTJS_PORT: Joi.number().required(),
				HOST: Joi.string().required(),
				PORT: Joi.number().required(),
				JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
				JWT_ACCESS_TOKEN_EXPIRATION_TIME: Joi.string().required(),
				JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
				JWT_REFRESH_TOKEN_EXPIRATION_TIME: Joi.string().required(),
				INTRA_SECRET: Joi.string().required(),
				INTRA_CLIENT_ID: Joi.string().required(),
				INTRA_CALLBACK_URL: Joi.string().required(),
				INTRA_AUTH_URL: Joi.string().required(),
				INTRA_TOKEN_URL: Joi.string().required(),
				TWOFA_APP_NAME: Joi.string().required(),
				DEFAULT_AVATAR_URL: Joi.string().required(),
			})
		}),
		UsersModule,
		AuthModule,
		DatabaseModule,
		GatewayModule,
		TwoFAModule,
		RoomModule,
		TypeOrmModule.forFeature([User, Room]),
		JwtModule,
	],
	controllers: [AppController],
	providers: [{
		provide: 'USER_SERVICE',
		useClass: UsersService
	},
		AuthService,
		UsersService,
		ConfigService,
		JwtService,
		UsersService,
		TwoFAService,
	],
})

export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(ValidateCustomerMiddleware)
			.forRoutes(UsersController, AppController, AuthController, RoomController, TwoFAController,
			);
	}
}
