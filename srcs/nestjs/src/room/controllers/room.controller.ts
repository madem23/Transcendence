import { Body, Controller, Delete, Get, HttpException, HttpStatus, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { RoomService } from '../services/room/room.service';
import { CreateRoomDto } from '../dtos/CreateRoom.dto';
import { PostgresErrorCode } from 'src/database/postgresErrorCodes.enum';

@Controller('rooms')
export class RoomController {
	constructor(private roomService: RoomService) { }

	@Get('')
	getRooms() {
		return this.roomService.findRooms();
	}

	@Get(':name')
	findRoom(@Param('name') name: string) {
		return this.roomService.findRoomByName(name);
	}

	@Get('checkPassword/:roomName/:password')
	async checkPassword(@Param('roomName') roomName: string, @Param('password') password: string) {
		try {
			const match = await this.roomService.checkRoomPassword(roomName, password);
			if (match === true)
				return true;
			return false;
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Post('create')
	async createRoom(@Body() createRoomDto: CreateRoomDto) {
		if (createRoomDto.type === 'game')
			createRoomDto.name = await this.roomService.generateRoomName();
		try {
			await this.roomService.createRoom(createRoomDto);
			return createRoomDto.name;
		} catch (error) {
			if (error?.code === PostgresErrorCode.UniqueViolation) {
				throw new HttpException('Room with that name already exists', HttpStatus.BAD_REQUEST);
			}
			throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Patch('setUser')
	async setUser(@Body() body) {
		try {
			await this.roomService.setUser(body.roomName, body.login, body.status);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Patch('removeUser')
	async removeUser(@Body() body) {
		try {
			await this.roomService.removeUser(body.roomName, body.username);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Patch('ban')
	async banUser(@Body() body) {
		try {
			await this.roomService.banUser(body.roomName, body.login);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Patch('unban')
	async unbanUser(@Body() body) {
		try {
			await this.roomService.unbanUser(body.roomName, body.login);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Delete('delete/:roomName')
	deleteRoom(@Param('roomName') roomName: string) {
		try {
			this.roomService.deleteRoom(roomName);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}

	@Patch('setPassword')
	async setPassword(@Body() body: any) {
		try {
			this.roomService.setPassword(body.roomName, body.newPassword, body.type);
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException(error.message);
			}
			throw error;
		}
	}
}
