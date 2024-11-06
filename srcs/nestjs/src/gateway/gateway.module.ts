import { Module } from '@nestjs/common';
import { myGateway } from './gateway';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { GameService } from '../game/game.service';
import { Room } from '@/database/entities/room.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([User, Room]),
		ConfigModule.forRoot({
			isGlobal: true,
		}),
	],
	providers: [myGateway, UsersService, ConfigService, GameService],
})
export class GatewayModule { }
