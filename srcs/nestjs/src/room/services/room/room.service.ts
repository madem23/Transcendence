import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from '@/database/entities/room.entity';
import { comparePasswords } from 'src/utils/bcrypt';
import { encodePassword } from 'src/utils/bcrypt';
import { CreateRoomParams } from 'src/utils/types';
import { Repository } from 'typeorm';

@Injectable()
export class RoomService {
	constructor(@InjectRepository(Room) private roomRepository: Repository<Room>,) { }

	findRooms() {
		return this.roomRepository.find();
	}

	findRoomByName(name: string) {
		return this.roomRepository.findOneBy({ name });
	}

	createRoom(roomInfo: CreateRoomParams) {
		const password = encodePassword(roomInfo.password);
		const newRoom = this.roomRepository.create({ ...roomInfo, password });
		return this.roomRepository.save(newRoom);
	}

	deleteRoom(roomName: string) {
		this.roomRepository.delete({ name: roomName });
	}


	async generateRoomName(): Promise<string> {
		while (1) {
			const name = 'game' + Math.floor(100000 + Math.random() * 900000);
			const existingRoom = await this.findRoomByName(name);
			if (!existingRoom)
				return name;
		}
	}

	async checkRoomPassword(roomName: string, password: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		const match = comparePasswords(password, room.password);
		if (match === true) {
			return true;
		}
		return false;
	}

	async setUser(roomName: string, login: string, status: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		room.users[login] = status;
		return this.roomRepository.save(room);
	}

	async banUser(roomName: string, login: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		room.banlist.push(login);
		return this.roomRepository.save(room);
	}

	async unbanUser(roomName: string, login: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		const index = room.banlist.indexOf(login);
		if (index !== -1)
			room.banlist.splice(index, 1);
		return this.roomRepository.save(room);
	}

	async removeUser(roomName: string, username: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		delete room.users[username];
		return this.roomRepository.save(room);
	}

	async setPassword(roomName: string, newPassword: string, type: string) {
		const room = await this.findRoomByName(roomName);

		if (!room) throw new NotFoundException(`Room named ${roomName} was not found`);
		room.type = type;
		room.password = encodePassword(newPassword);
		return this.roomRepository.save(room);
	}
}
