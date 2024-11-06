import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UsersService } from "src/users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/database/entities/user.entity";
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from "./strategies/LocalStrategy";
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from "./strategies/JwtStrategy";
import { JwtRefreshTKStrategy } from "./strategies/JwtRefreshStrategy";
import { IntraStrategy } from "./strategies/IntraStrategy";
import { HttpModule } from '@nestjs/axios';
import { TwoFAService } from "src/2-fa/2-fa.service";
import { Room } from "@/database/entities/room.entity";


@Module({
	imports: [
		HttpModule,
		TypeOrmModule.forFeature([User, Room]),
		PassportModule,
		ConfigModule.forRoot(),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				secret: configService.get('JWT_ACCESS_TOKEN_SECRET'),
				signOptions: {
					expiresIn: `${configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME')}s`,
				},
			}),
		}),
	],
	controllers: [AuthController],
	providers: [
		{
			provide: 'AUTH_SERVICE',
			useClass: AuthService
		},
		{
			provide: 'USER_SERVICE',
			useClass: UsersService
		},
		LocalStrategy,
		JwtStrategy,
		JwtRefreshTKStrategy,
		IntraStrategy,
		TwoFAService,
	],
})
export class AuthModule { }