import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserParams, Message, UpdateUserProfileParams, log } from 'src/utils/types';
import { User } from 'src/database/entities/user.entity';
import { Repository } from 'typeorm';
import { encodePassword } from 'src/utils/bcrypt';
import * as bcrypt from 'bcrypt';
import { IntraUserParams } from '../utils/types';
import { ConfigService } from '@nestjs/config';
import * as mime from 'mime';
import { Room } from '@/database/entities/room.entity';
import { PostgresErrorCode } from '@/database/postgresErrorCodes.enum';


@Injectable()
export class UsersService {

	constructor(
		@InjectRepository(User) private userRepository: Repository<User>,
		@InjectRepository(Room) private roomRepository: Repository<Room>,
		private readonly configService: ConfigService,
	) {
	}

	/*
	* ============================
	* User Profile
	* ============================
	*/

	findUsers() {
		return this.userRepository.find();
	}

	async findUsersByWinsDesc() {
		const users = await this.userRepository.find();
		return users.sort((a, b) => b.wins - a.wins);
	}

	async findRoomByName(name: string) {
		const room = await this.roomRepository.findOneBy({ name });
		if (room) {
			return room;
		}
		else
			return null;
	}

	async generateDefaultUsername(login: string) {
		let username = login;
		do {
			try {
				const existingUser = await this.findUserByUsername(username);
				const room = await this.findRoomByName(username);
				if (!existingUser && !room) {
					return username;
				}
				username = login + Math.floor(100000 + Math.random() * 900000);
			} catch (error) {
				username = login + Math.floor(100000 + Math.random() * 900000);
				return username;
			}
		} while (true);
	}



	async createIntraUser(userDetails: IntraUserParams) {
		const username = await this.generateDefaultUsername(userDetails.login);
		const newUser = this.userRepository.create({
			...userDetails,
			username,
		});
		return this.userRepository.save(newUser);

	}

	async updateUserProfile(login: string, userDetails: UpdateUserProfileParams) {

		const rooms = await this.roomRepository.find();
		if (userDetails.username) {
			const room = await this.findRoomByName(userDetails.username);
			if (room) {
				throw new Error('Room already exists with this name');
			}
		}
		const newUser = await this.userRepository.update({ login }, {
			...userDetails
		});
		return newUser;
	}

	async updateStatus(login: string, statusUser: string) {
		const newUser = await this.userRepository.update({ login }, { status: statusUser });
		return newUser;
	}

	updateLogs(id: number, logs: log[]) {
		const newUser = this.userRepository.update({ id }, { logs: logs });
		return newUser;
	}

	async createLocalUser(userDetails: CreateUserParams) {
		const password = encodePassword(userDetails.password);
		const username = await this.generateDefaultUsername(userDetails.login.split('@')[0]);
		const avatarUrl = this.configService.get('DEFAULT_AVATAR_URL');
		const newUser = this.userRepository.create({
			...userDetails,
			username,
			avatarUrl,
			password
		});
		return this.userRepository.save(newUser);
	}

	//DEV MOD
	// deleteUser(id: number) {
	// 	return this.userRepository.delete({ id });
	// }
	// deleteAllUsers() {
	// 	return this.userRepository.delete({});
	// }

	async findUserByUsername(username: string) {
		return this.userRepository.findOneBy({ username });
	}

	async findUserByLogin(login: string) {
		return this.userRepository.findOneBy({ login });
	}

	async findUserById(id: number) {
		const user = await this.userRepository.findOneBy({ id });
		if (user)
			return user;
		throw new HttpException('User with this id does not exist', HttpStatus.NOT_FOUND);
	}

	async isFriend(currentUserId: number, targetId: number) {
		const user = await this.findUserById(currentUserId);
		const friend = await this.findUserById(targetId);
		if (!user || !friend) {
			throw new Error('User not found');
		}
		if (user.friends.includes(friend.login)) {
			return true;
		}
		else {
			return false;
		}
	}


	isValidImageFile(originalname: string, fileData: Buffer, maxSizeBytes: number): boolean {

		const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
		const fileMimeType = mime.lookup(originalname);

		if (!fileMimeType || !allowedMimeTypes.includes(fileMimeType)) {
			return false;
		}

		if (fileData.length > maxSizeBytes) {
			return false;
		}
		return true;
	}

	async findLevelByLogin(login: string) {
		const user = await this.findUserByLogin(login);
		const level: number = user.level;
		return level;
	}


	/*
	* ============================
	* Auth
	* ============================
	*/

	async setCurrentRefreshToken(refreshToken: string, userId: number) {
		const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
		await this.userRepository.update(userId, {
			currentHashedRefreshToken
		});
	}

	async getUserIfRefreshTokenMatches(refreshToken: string, userId: number) {
		const user = await this.findUserById(userId);

		const isRefreshTokenMatching = await bcrypt.compare(
			refreshToken,
			user.currentHashedRefreshToken
		);

		if (isRefreshTokenMatching) {
			return user;
		}
	}

	async removeRefreshToken(userId: number) {
		return this.userRepository.update(userId, {
			currentHashedRefreshToken: null
		});
	}

	async setTwoFASecret(secret: string, id: number) {
		return this.userRepository.update({ id }, { twoFASecret: secret });
	}

	async turnOn2FA(id: number) {
		return this.userRepository.update({ id }, { is2FAEnabled: true });
	}

	async turnOff2FA(id: number) {
		return this.userRepository.update({ id }, { is2FAEnabled: false });
	}



	/*
	* ============================
	* Database
	* ============================
	*/

	async addFriend(currentUser: User, friendId: number) {
		const friend = await this.findUserById(friendId);
		if (!friend) {
			throw new NotFoundException('User not found');
		}
		if (currentUser.friends.includes(friend.login)) {
			throw new Error('this player is already your friend.');
		}
		else if (currentUser.blocked_users.includes(friend.login)) {
			this.deleteBlockedUser(currentUser, friendId);
		}

		currentUser.friends.push(friend.login);
		const updatedUser = await this.userRepository.save(currentUser);
		return updatedUser;
	}

	async deleteFriend(currentUser: User, friendId: number): Promise<void> {
		const friend = await this.findUserById(friendId);
		if (!friend) {
			throw new NotFoundException('User not found');
		}
		const indexToRemove = currentUser.friends.indexOf(friend.login);
		if (indexToRemove !== -1) {
			currentUser.friends.splice(indexToRemove, 1);
			await this.userRepository.save(currentUser);
		}
		else {
			throw new Error('this player is already not your friend');
		}
	}

	async addBlockedUser(currentUser: User, blockedUserToAddId: number): Promise<void> {
		const userToBlock = await this.findUserById(blockedUserToAddId);
		if (!userToBlock) {
			throw new NotFoundException('User to block not found');
		}

		if (currentUser.blocked_users.includes(userToBlock.login)) {
			throw new Error('this player is already blocked');
		}
		// To verify if the blocked user is in the friends list and remove it
		const friendIndex = currentUser.friends.indexOf(userToBlock.login);
		if (friendIndex !== -1) {
			currentUser.friends.splice(friendIndex, 1);
		}

		currentUser.blocked_users.push(userToBlock.login);
		await this.userRepository.save(currentUser);
		await this.userRepository.save(userToBlock);
	}

	async deleteBlockedUser(currentUser: User, blockedUserToDeleteId: number): Promise<void> {
		const userToUnblock = await this.findUserById(blockedUserToDeleteId);
		if (!userToUnblock) {
			throw new NotFoundException('User to unblock not found');
		}

		const indexToRemove = currentUser.blocked_users.indexOf(userToUnblock.login);
		if (indexToRemove !== -1) {
			currentUser.blocked_users.splice(indexToRemove, 1);
			await this.userRepository.save(currentUser);
		}
		else {
			throw new Error('this player is not blocked.');
		}
	}

	async addMatch(currentUserId: number, opponentId: number, userScore: number, opponentScore: number) {
		let opponent = {
			login: 'IA',
		}
		if (opponentId != null)
			opponent = await this.findUserById(opponentId);
		const currentUser: User = await this.findUserById(currentUserId);
		if (!opponent) {
			throw new NotFoundException('Opponent not found');
		}
		try {
			const victory = userScore > opponentScore;
			const match = {
				"opponent_login": opponent.login,
				"victory": victory,
				"opponent_score": opponentScore,
				"user_score": userScore,
				"date": new Date(),
			};
			if (match.victory) {
				this.incrementWins(currentUser);
				this.incrementLevel(currentUser);
			}
			else {
				this.incrementLosses(currentUser);
			}
			currentUser.match_history.push(match);
			await this.userRepository.save(currentUser);
		}
		catch (error) {
			throw new Error('match has not been added.');
		}
	}

	/*
	* ============================
	* Game
	* ============================
	*/

	async incrementLosses(currentUser: User) {
		currentUser.losses += 1;
		await this.userRepository.save(currentUser);
	}

	async incrementWins(currentUser: User) {
		currentUser.wins += 1;
		if (currentUser.wins === 100) {
			this.setAchievement(currentUser, ['100_wins']);
		}
		await this.userRepository.save(currentUser);
	}

	async incrementLevel(currentUser: User) {

		currentUser.level += 0.3;
		if (currentUser.level >= 21) {
			this.setAchievement(currentUser, ['level_21']);
		}
		await this.userRepository.save(currentUser);
	}

	/*
	* ============================
	* Pop Up
	* ============================
	*/

	async setAchievement(currentUser: User, achievementTypes: string[]) {

		for (let achievementType of achievementTypes) {
			let achievementObj = currentUser.achievements.find(achievement => achievement.name === achievementType);
			if (achievementObj && achievementObj.date === null) {
				achievementObj.date = new Date();
			}
		}
		await this.userRepository.save(currentUser);
	}


	async getListAchievementToPop(currentUser: User) {
		let achievements = [];

		const welcome = currentUser.achievements.find(achievement => achievement.name === 'welcome_mdemma');
		if (welcome.date === null) {
			achievements.push('welcome_mdemma');
		}

		if (currentUser.friends.length >= 1) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'first_friend');
			if (ach.date === null) {
				achievements.push('first_friend');
			}
		}

		if (currentUser.wins >= 1) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'first_blood');
			if (ach.date === null) {
				achievements.push('first_blood');
			}
		}

		if (currentUser.wins >= 100) {
			const ach = currentUser.achievements.find(achievement => achievement.name === '100_wins');
			if (ach.date === null) {
				achievements.push('100_wins');
			}
		}

		if (currentUser.losses >= 1) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'first_loss');
			if (ach.date === null) {
				achievements.push('first_loss');
			}
		}

		if (currentUser.level >= 21) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'level_21');
			if (ach.date === null) {
				achievements.push('level_21');
			}
		}

		if (currentUser.match_history.length >= 1) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'first_play');
			if (ach.date === null) {
				achievements.push('first_play');
			}
		}

		const hasMatchWithMmidon = currentUser.match_history.some(match => {
			return match.opponent_login === 'mmidon' && match.user_score > match.opponent_score;
		});
		if (hasMatchWithMmidon) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'win_vs_mmidon');
			if (ach.date === null) {
				achievements.push('win_vs_mmidon');
			}
		}
		const hasMatchWithZeroOpponentScore = currentUser.match_history.some(match => match.opponent_score === 0);

		if (hasMatchWithZeroOpponentScore) {
			const ach = currentUser.achievements.find(achievement => achievement.name === 'kiss_it_flemaitr');
			if (ach.date === null) {
				achievements.push('kiss_it_flemaitr');
			}
		}

		this.setAchievement(currentUser, achievements);
		return achievements;
	}

	async openDM(user: User, partnerID: number) {
		if (user.privateMessages[partnerID] === undefined) {
			user.privateMessages = {
				...user.privateMessages,
				[partnerID]: [],
			}
			await this.userRepository.save(user);
		}
	}

	async closeDM(user: User, partnerID: number) {
		if (user.privateMessages[partnerID]) {
			delete user.privateMessages[partnerID];
			await this.userRepository.save(user);
		}
	}

	async addDM(user: User, partnerID: number, message: Message) {
		if (user.privateMessages[partnerID] === undefined) {
			this.openDM(user, partnerID);
		}
		user.privateMessages[partnerID].push(message);
		await this.userRepository.save(user);
	}
}

