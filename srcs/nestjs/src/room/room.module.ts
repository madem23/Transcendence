import { Module } from '@nestjs/common';
import { RoomController } from './controllers/room.controller';
import { RoomService } from './services/room/room.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '@/database/entities/room.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Room,])],
	controllers: [RoomController],
	providers: [RoomService]
})
export class RoomModule { }
