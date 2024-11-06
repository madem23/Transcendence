import {
	Body, Controller, Get, Param,
	Post, Put, Patch,
	HttpException, HttpStatus, Req, Res,
	ValidationPipe,
	UseGuards, NotFoundException, UseInterceptors, UploadedFile
} from '@nestjs/common';
import { Response } from 'express';
import { CreateLocalUserDto } from 'src/users/dtos/CreateLocalUser.dto';
import { UsersService } from 'src/users/users.service';
import { UpdateUserProfileDto } from 'src/users/dtos/UpdateUserProfile.dto';
import { PostgresErrorCode } from 'src/database/postgresErrorCodes.enum';
import { currentUser } from '../utils/currentUser.decorator'
import { User } from '../database/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/JwtAuthGuard'
import RequestWithUser, { dataDate, log } from 'src/utils/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { IdDto } from './dtos/Id.dto';
import { LogsDto } from './dtos/Logs.dto';

@Controller('users')
export class UsersController {
	constructor(
		private userService: UsersService
	) { }

	/*
	* ============================
	* User Profile
	* ============================
	*/

	/* Create user for local auth strategy with a unique login and PW. */
	@Post('local-register')
	async localRegister(
		@Body() localUser: CreateLocalUserDto
	) {
		try {
			await this.userService.createLocalUser(localUser);
			return {
				message: 'User registered successfully.',
				status: HttpStatus.OK,
			};
		} catch (error) {
			if (error?.code === PostgresErrorCode.UniqueViolation) {
				throw new HttpException('User with that username already exists', HttpStatus.BAD_REQUEST);
			}
			throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	/* Modify user profile { username }. */
	@UseGuards(JwtAuthGuard)
	@Patch('update-profile')
	async updateUserProfile(
		@Body() updatedProfile: UpdateUserProfileDto,
		@currentUser() user: User) {
		try {
			await this.userService.updateUserProfile(user.login, updatedProfile);
			return 'User profile updated successfully.';
		} catch (error) {
			if (error?.code === PostgresErrorCode.UniqueViolation) {
				throw new HttpException('User with that username already exists', HttpStatus.BAD_REQUEST);
			}
			if (error.message === 'Room already exists with this name')
				throw new HttpException('User with that username already exists', HttpStatus.BAD_REQUEST);
			throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	//DEV MODE
	// @UseGuards(JwtAuthGuard)
	// @Delete(':id')
	// async deleteUserById(@Param('id', ParseIntPipe) id: number) {
	// 	await this.userService.deleteUser(id);
	// 	throw new HttpException('User deleted successfully.', HttpStatus.NO_CONTENT);
	// }

	@UseGuards(JwtAuthGuard)
	@Post('logs')
	async addLogs(@Req() request: RequestWithUser, @Body() body: LogsDto) {
		try {
			const allLogs = request.user.logs.concat(body.logs);
			// Remove duplicates based on all properties
			let uniqueLogs = allLogs.filter((log: log, index, self) =>
				index === self.findIndex(
					(l) =>
						l.time === log.time &&
						l.message === log.message &&
						l.type === log.type
				)
			);
			if (uniqueLogs.length > 100) {
				uniqueLogs = uniqueLogs.slice(-100);
			}
			await this.userService.updateLogs(request.user.id, uniqueLogs);
			return { success: true, message: 'Logs added successfully' };
		} catch (error) {
			return { success: false, message: 'Failed to add logs', error: error.message };
		}
	}

	/*
	* ============================
	* Avatar & PP
	* ============================
	*/

	/*
	* get the avatar picture stored in DB: 
	- either by returning image's actual stored url
	- or by return /users/profile-picture if we stored image bin data */
	@UseGuards(JwtAuthGuard)
	@Get('avatar')
	async getAvatar(@Req() request: RequestWithUser) {
		try {
			const user = await this.userService.findUserByLogin(request.user.login);
			if (!user) {
				return 'User not found';
			}
			const profilePictureUrl = user.avatarUrl;
			return profilePictureUrl;
		} catch (error) {
			return 'Something went wrong';
		}
	}

	@Get('profile-pictures/:id/:id1')
	async getProfilePicture(@Param('id') id: number, @Res() response: Response) {
		try {
			const user = await this.userService.findUserById(id);
			if (!user) {
				return 'User not found';
			}
			response.setHeader('Content-Type', 'image/jpeg');
			response.send(user.avatarData);
		} catch (error) {
			return 'Something went wrong';
		}
	}

	@UseGuards(JwtAuthGuard)
	@Patch('avatar')
	@UseInterceptors(FileInterceptor('file'))
	async uploadAvatar(@Req() request: RequestWithUser, @UploadedFile() file) {
		try {
			const user = await this.userService.findUserByLogin(request.user.login);
			if (!user) {
				return 'User not found';
			}

			const maxSizeBytes = 5 * 1024 * 1024; // 25MB
			const avatarData = file.buffer; //decode the string to binary data

			if (!this.userService.isValidImageFile(file.originalname, avatarData, maxSizeBytes)) {
				throw new HttpException('Invalid file type or size.', 400);
			}

			const avatarUrl = `/api/users/profile-pictures/${user.id}/${Math.random()}`; //deletes the former avatar

			await this.userService.updateUserProfile(user.login, { avatarData, avatarUrl });
			return 'Avatar uploaded successfully.';
		} catch (error) {
			return 'Something went wrong';
		}
	}

	/*
	* ============================
	* Home Page - PUBLIC info
	* ============================
	*/

	@UseGuards(JwtAuthGuard)
	@Get('')
	async getUsers() {
		return this.userService.findUsers();
	}

	@UseGuards(JwtAuthGuard)
	@Get('by_wins')
	async getUsersByWins(@Req() req: RequestWithUser) {
		try {
			const currentUser = req.user;
			const users = await this.userService.findUsersByWinsDesc();
			if (!users) {
				return [];
			}
			const formattedUsers = users.map(user => {
				const avatar = user.avatarUrl;
				const blocked = currentUser.blocked_users.includes(user.login);
				const isFriend = currentUser.friends.includes(user.login);
				return {
					id: user.id,
					username: user.username,
					level: user.level,
					wins: user.wins,
					losses: user.losses,
					avatar: avatar,
					status: user.status,
					isBlocked: blocked,
					isFriend: isFriend
				};
			});
			return formattedUsers;
		} catch (error) {
			return 'Something went wrong';
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('online')
	async getOnlineUsers(@Req() req: RequestWithUser) {
		try {
			const currentUser = req.user;
			const users = await this.userService.findUsers();

			if (!users) {
				return [];
			}

			const filteredUsers = users.filter(user => user.status === "online" || user.status === "ongame");
			const formattedUsers = await Promise.all(filteredUsers.map(user => {
				const avatar = user.avatarUrl;
				const blocked = currentUser.blocked_users.includes(user.login);
				const isFriend = currentUser.friends.includes(user.login);
				return {
					id: user.id,
					username: user.username,
					level: user.level,
					wins: user.wins,
					losses: user.losses,
					avatar: avatar,
					status: user.status,
					isBlocked: blocked,
					isFriend: isFriend
				};
			}));

			return formattedUsers;
		} catch (error) {
			return { message: 'An error occurred while fetching online users.' };
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('friends_list')
	async getFriendList(@Req() request: RequestWithUser, @Res() response: Response) {
		try {
			const user = request.user;
			if (!user) {
				return response.status(HttpStatus.NOT_FOUND).json({ message: 'User not found.' });
			}
			const friendsLogin = user.friends;
			if (friendsLogin.length === 0) {
				return response.status(HttpStatus.OK).json(friendsLogin);
			}
			const friendsData = await Promise.all(
				friendsLogin.map(async (friendLogin) => {
					const friendData = await this.userService.findUserByLogin(friendLogin);
					if (friendData) {
						const avatar = friendData.avatarUrl;
						return {
							id: friendData.id,
							username: friendData.username,
							level: friendData.level,
							wins: friendData.wins,
							losses: user.losses,
							avatar: avatar,
							status: friendData.status,
						};
					}
				})
			);
			return response.status(HttpStatus.OK).json(friendsData);
		} catch (error) {
			return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while fetching friend list.' });
		}
	}


	@UseGuards(JwtAuthGuard)
	@Get('blocked_list')
	async getBlockedList(@Req() request: RequestWithUser, @Res() response: Response) {
		try {
			const user = request.user;
			if (!user) {
				return response.status(HttpStatus.NOT_FOUND).json({ message: 'User not found.' });
			}
			const blockedLogin = user.blocked_users;
			if (blockedLogin.length === 0) {
				return response.status(HttpStatus.OK).json(blockedLogin);
			}

			const blockedData = await Promise.all(
				blockedLogin.map(async (login) => {
					const data = await this.userService.findUserByLogin(login);
					if (data) {
						const avatar = data.avatarUrl;
						return {
							id: data.id,
							username: data.username,
							level: data.level,
							wins: data.wins,
							losses: user.losses,
							avatar: avatar,
							status: data.status,
						};
					}
				})
			);
			const ret = blockedData.filter(Boolean); // Deletes undefined/null entries
			return response.status(HttpStatus.OK).json(ret);
		} catch (error) {
			return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while fetching blocked users list.' });
		}
	}


	@Get('match_history/:id')
	async getMatchHistory(@Param('id') id: number, @Res() response: Response) {
		const user = await this.userService.findUserById(id);
		if (!user) {
			throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
		}
		const matches = user.match_history.reverse();
		if (matches.length === 0) {
			return response.status(HttpStatus.OK).json(matches);
		}
		const matchesData = await Promise.all(
			matches.map(async (match) => {
				let opponent;
				if (match.opponent_login === 'IA') {
					opponent = {
						username: 'IA',
						avatarUrl: 'https://cdn.dribbble.com/users/281679/screenshots/14897126/media/f52c47307ac2daa0c727b1840c41d5ab.png?compress=1&resize=400x300&vertical=center',
						status: 'ongame'
					}
				} else
					opponent = await this.userService.findUserByLogin(match.opponent_login);
				if (!opponent) {
					throw new NotFoundException('Opponent not found');
				}
				return {
					opp_user: opponent.username,
					my_score: match.user_score,
					opp_score: match.opponent_score,
					opp_url: opponent.avatarUrl,
					result: match.victory ? "WIN" : "LOSE",
					opp_status: opponent.status,
					actDate: new Date(match.date),
				}
			})
		);

		const dateArray: dataDate[] = [];

		for (let match of matchesData) {

			const DateString = `${match.actDate.getDate().toString().padStart(2, '0')}-${(match.actDate.getMonth() + 1).toString().padStart(2, '0')}-${match.actDate.getFullYear()}`;

			if (dateArray.at(-1)?.date === DateString)
				dateArray.at(-1).arrayDataMatch.push(match);
			else
				dateArray.push({
					date: DateString,
					arrayDataMatch: [match],
				})
		}
		return response.status(HttpStatus.OK).json(dateArray);
	}

	@UseGuards(JwtAuthGuard)
	@Get('by_login/:logins')
	async getUsersByLogin(@Req() req: RequestWithUser, @Param('logins') loginsStr: string): Promise<any> {
		try {
			const logins = loginsStr.split(' ');
			const users = await Promise.all(
				logins.map(async (login) => {
					const user = await this.userService.findUserByLogin(login);
					if (user) {
						const avatar = user.avatarUrl;
						return {
							id: user.id,
							username: user.username,
							level: user.level,
							wins: user.wins,
							losses: user.losses,
							avatar: avatar,
							status: user.status,
							isBlocked: req.user.blocked_users.includes(user.login),
							isFriend: req.user.friends.includes(user.login),
						};
					}
				}),
			);
			return users;
		} catch (error) {
			return { message: 'An error occurred while fetching users by login.' };
		}
	}


	@UseGuards(JwtAuthGuard)
	@Get('list_by_IDs/:IDlist')
	async getUserListByIDs(@Req() req: RequestWithUser, @Param('IDlist') IDlist: string): Promise<any> {
		try {
			const IDs = IDlist.split(' ');
			const users = await Promise.all(
				IDs.map(async (ID) => {
					const user = await this.userService.findUserById(parseInt(ID));
					if (user) {
						const avatar = user.avatarUrl;
						return {
							id: user.id,
							username: user.username,
							level: user.level,
							wins: user.wins,
							losses: user.losses,
							avatar: avatar,
							status: user.status,
							isBlocked: req.user.blocked_users.includes(user.login),
							isFriend: req.user.friends.includes(user.login),
						};
					}
				}),
			);
			return users;
		} catch (error) {
			return { message: 'An error occurred while fetching users by IDs.' };
		}
	}


	@UseGuards(JwtAuthGuard)
	@Get('by_username/:username')
	async getUsersByUsername(@Req() req: RequestWithUser, @Param('username') username: string) {
		try {
			const user = await this.userService.findUserByUsername(username);
			if (user) {
				return {
					...user,
					avatar: user.avatarUrl,
					isBlocked: req.user.blocked_users.includes(user.login),
					isFriend: req.user.friends.includes(user.login),
				};
			} else {
				return { message: 'User not found.' };
			}
		} catch (error) {
			return { message: 'An error occurred while fetching user by username.' };
		}
	}


	/*
	* ===========================================
	* List management (friends, blocked, matches)
	* ===========================================
	*/

	@UseGuards(JwtAuthGuard)
	@Put('add-friend')
	async addFriend(
		@Req() request: RequestWithUser, @Res() response,
		@Body(new ValidationPipe({ transform: true })) body: IdDto,
	) {
		if (request.user.id === body.id)
			throw new HttpException('you are this user', HttpStatus.BAD_REQUEST);
		try {
			await this.userService.addFriend(request.user, body.id);

			const ach = request.user.achievements.find(achievement => achievement.name === 'first_friend');
			if (ach.date === null) {
				this.userService.setAchievement(request.user, ['first_friend']);
				return response.status(HttpStatus.OK).json({ message: 'Friend added successfully.', ach: true });
			}
			return response.status(HttpStatus.OK).json({ message: 'Friend added successfully.', ach: false });

		} catch (error) {
			return response.status(HttpStatus.BAD_REQUEST);
		}
	}

	@UseGuards(JwtAuthGuard)
	@Put('delete-friend')
	async deleteFriend(
		@Req() request: RequestWithUser,
		@Body(new ValidationPipe({ transform: true })) body: IdDto,
	) {
		if (request.user.id === body.id)
			throw new HttpException('you are this user', HttpStatus.BAD_REQUEST);
		try {
			await this.userService.deleteFriend(request.user, body.id);
			return { message: 'Friend deleted successfully.' };
		} catch (error) {
			throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
		}
	}

	@UseGuards(JwtAuthGuard)
	@Put('block-user')
	async addBlockedUser(
		@Req() request: RequestWithUser,
		@Body(new ValidationPipe({ transform: true })) data: IdDto,
	) {
		if (request.user.id === data.id)
			throw new HttpException('You are this user', HttpStatus.BAD_REQUEST);
		try {
			await this.userService.addBlockedUser(request.user, data.id);
			return { message: 'User blocked successfully.' };
		} catch (error) {
			throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
		}
	}

	@UseGuards(JwtAuthGuard)
	@Put('unblock-user')
	async deleteBlockedUser(
		@Req() request: RequestWithUser,
		@Body(new ValidationPipe({ transform: true })) data: IdDto,
	) {
		if (request.user.id === data.id)
			throw new HttpException('you are this user', HttpStatus.BAD_REQUEST);
		try {
			await this.userService.deleteBlockedUser(request.user, data.id);
			return { message: 'User unblocked successfully.' };
		} catch (error) {
			throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
		}
	}


	/*
	* ============================
	* Achievements
	* ============================
	*/

	@Get('achievement-profile-page/:id')
	async getAchievementProfilePage(@Param('id') id: number,
		@Body() data: string[]) {
		const user = await this.userService.findUserById(id);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		try {
			user.achievements.sort((a, b) => {
				if (!a.date && !b.date) return 0;
				if (!a.date) return 1;
				if (!b.date) return -1;

				const dateA = a.date instanceof Date ? a.date : new Date(a.date);
				const dateB = b.date instanceof Date ? b.date : new Date(b.date);

				return dateA.getTime() - dateB.getTime();
			});

			return user.achievements;
		}
		catch (error) {
			return { message: 'Achievement not found' };
		}
	}


	@UseGuards(JwtAuthGuard)
	@Put('achievements')
	async validateAchievement(
		@Req() request: RequestWithUser,
		@Res() response,
		@Body() body: { data: string }) {

		const user = await this.userService.findUserByLogin(request.user.login);
		if (!user) {
			throw new NotFoundException('User not found');
		}

		try {
			const ach = user.achievements.find(achievement => achievement.name === body.data);
			if (ach.date === null) {
				this.userService.setAchievement(user, [body.data]);
				return response.status(HttpStatus.OK).json({ message: true });
			}
			else {
				return response.status(HttpStatus.OK).json({ message: false });
			}
		}
		catch (error) {
			return response.status(HttpStatus.OK).json({ message: false });
		}
	}


	@UseGuards(JwtAuthGuard)
	@Get('achievements')
	async getAchievements(@Req() request: RequestWithUser, @Res() response) {
		try {

			const user = await this.userService.findUserByLogin(request.user.login);
			if (!user) {
				throw new NotFoundException('User not found');
			}
			const data = await this.userService.getListAchievementToPop(user);
			return response.json(data);
		} catch (error) {
			console.error(`Error in matchAchievement: ${error}`);
			return response.status(500).json({ error: 'Internal Server Error' });
		}
	}


	/*
	* ============================
	* Chat
	* ============================
	*/


	@UseGuards(JwtAuthGuard)
	@Put('openDM')
	async openDm(@Req() request: RequestWithUser, @Body('partner') partnerID: number) {
		try {
			const user = request.user;
			if (!user) {
				throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
			}
			this.userService.openDM(user, partnerID);
		} catch (error) {
			throw new HttpException('Something went wrong.', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}


	@UseGuards(JwtAuthGuard)
	@Put('closeDM')
	async closeDm(@Req() request: RequestWithUser, @Body('partner') partnerID: number) {
		try {
			const user = request.user;
			if (!user) {
				throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
			}
			this.userService.closeDM(user, partnerID);
		} catch (error) {
			throw new HttpException('Something went wrong.', HttpStatus.INTERNAL_SERVER_ERROR);
		}
	}

	@Put('updateDM')
	async updateDM(@Req() request: RequestWithUser, @Res() response, @Body() body) {
		try {
			let achievement_status = false;
			const user1 = await this.userService.findUserByUsername(body.user1);
			const user2 = await this.userService.findUserByUsername(body.user2);
			const userBleotard = await this.userService.findUserByUsername(body.user2);
			if (!user1) {
				return response.status(HttpStatus.NOT_FOUND).json({ message: 'User 1 not found.' });
			}
			if (!user2) {
				return response.status(HttpStatus.NOT_FOUND).json({ message: 'User 2 not found.' });
			}
			if (userBleotard && userBleotard.login === "bleotard") {
				const ach = user1.achievements.find(achievement => achievement.name === 'dm_bleotard');
				if (ach.date === null) {
					this.userService.setAchievement(user1, ["dm_bleotard"]);
					achievement_status = true;
				}
			}
			this.userService.addDM(user1, user2.id, body.message);
			this.userService.addDM(user2, user1.id, body.message);
			return response.status(HttpStatus.OK).json({ achievement: achievement_status });
		} catch (error) {
			return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'An error occurred while updating DM.' });
		}
	}



	/*
	* ============================
	* Getters
	* ============================
	*/

	@UseGuards(JwtAuthGuard)
	@Get('user_info')
	async getUserInfo(@Req() request: RequestWithUser, @Res() response) {
		try {
			const user = request.user;
			if (!user) {
				throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
			}
			return response.status(HttpStatus.OK).json({
				id: user.id,
				login: user.login,
				username: user.username,
				avatar: user.avatarUrl,
				twofa: user.is2FAEnabled,
				status: user.status,
				level: user.level,
				wins: user.wins,
				losses: user.losses,
				friends: user.friends,
				blocked_users: user.blocked_users,
				achievements: user.achievements,
				logs: user.logs,
				privateMessages: user.privateMessages,
			});
		} catch (error) { }
	}
}
