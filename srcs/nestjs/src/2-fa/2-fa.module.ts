import { Module } from '@nestjs/common';
import { TwoFAController } from './2-fa.controller';
import { TwoFAService } from './2-fa.service';
import { UsersService } from '../users/users.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from '../database/entities/user.entity';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { Room } from '@/database/entities/room.entity';

@Module({
	imports: [ConfigModule.forRoot(),
	TypeOrmModule.forFeature([User, Room])
	],
	controllers: [TwoFAController],
	providers: [
		TwoFAService,
		JwtService,
		{
			provide: 'USER_SERVICE',
			useClass: UsersService
		},
		{
			provide: 'AUTH_SERVICE',
			useClass: AuthService
		},]
})
export class TwoFAModule { }
