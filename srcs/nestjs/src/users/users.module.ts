import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { Room } from '@/database/entities/room.entity';

@Module({
	imports: [TypeOrmModule.forFeature([User, Room])],
	controllers: [UsersController],
	providers: [UsersService, ConfigService]
})
export class UsersModule { }