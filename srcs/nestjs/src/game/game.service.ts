import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { GameEventBody } from 'src/utils/types';


export interface PlayerData {
	paddlePosition: number;
	score: number;
	socket: Socket;
	isBot: Boolean;
	level: number;
};

export class Vector {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	normalize(): Vector {
		const magnitude = Math.sqrt(this.x * this.x + this.y * this.y);
		return new Vector(this.x / magnitude, this.y / magnitude);
	}
};

export interface Ball {
	position: Vector;
	direction: Vector;
};

export class GameData {
	eventBody: GameEventBody;
	countdownInterval: NodeJS.Timeout;
	players: Map<Socket, PlayerData>;
	bots: Map<number, PlayerData>;
	roomName: string;
	pongSet: number;
	pongTheme: string;
	increaseBall: number;
	getBall: string;
	moveAmount: number;
	ball: Ball;
	lastScorer: 'left' | 'right' | null = null;
	updateInterval: NodeJS.Timeout;
	updateIntervalIA: NodeJS.Timeout;
	levelIA: string;
	iaId: number;
	constructor(roomName: string) {
		this.players = new Map();
		this.bots = new Map();
		this.roomName = roomName;
		this.pongSet = 11;
		this.pongTheme = 'default';
		this.ball = {
			position: new Vector(0.5, 0.5),
			direction: new Vector(0, 0)
		}
		this.getBall = '';
		this.levelIA = '';
		this.iaId = Math.random();
		this.moveAmount = 0.005;
	}

	setPongSet(pongSet: number) {
		this.pongSet = pongSet;
	}


	setPongTheme(pongTheme: string) {
		this.pongTheme = pongTheme;
	}

	getPongSet(): number {
		return this.pongSet;
	}

	getPongTheme(): string {
		return this.pongTheme;
	}

	setgetBall(getBall: string) {
		this.getBall = getBall;
	}
}

@Injectable()
export class GameService {
	constructor(private readonly userService: UsersService) { }

	private allGameRooms: Map<string, GameData> = new Map();

	public matchmakingQueue: Socket[] = [];


	getAllGameRooms() {
		return this.allGameRooms;
	}

	createRoom(socket: Socket): string {
		const roomName: string = "room" + Math.random()
		const gameData: GameData = new GameData(roomName);
		this.joinPlayer(gameData, socket, false);
		this.allGameRooms.set(roomName, gameData);
		return roomName;
	}

	/* Clears game room and revert players' status back to online*/
	deleteRoom(roomName: string, event: GameEventBody | null) {
		const actRoom = this.getRoom(roomName);

		if (!actRoom) {
			return;
		}
		const count = actRoom.players.size;
		for (let [_, player] of actRoom.players) {
			if (count == 2 || (count == 1 && actRoom.bots.size)) {
				player.socket.emit('finishGame', null);
			}
			else if (count < 2)
				player.socket.emit('gameAborted');
			if (player.socket?.data?.user?.login)
				this.userService.updateStatus(player.socket.data.user.login, 'online');
			player.socket.data.roomName = undefined;
		}
		clearInterval(actRoom.countdownInterval);
		clearInterval(actRoom.updateInterval);
		clearInterval(actRoom.updateIntervalIA);

		actRoom.updateInterval = undefined;
		this.allGameRooms.delete(roomName);

	}

	getRoom(roomName: string) {
		return this.allGameRooms.get(roomName);
	}

	async sendUpdateNotif(room: GameData) {

		let allPlayers = [...room.players.values()];

		if (room.bots && room.bots.size > 0) {
			allPlayers = [...allPlayers, ...room.bots.values()];
		}

		const levelPromises = allPlayers
			.filter(player => !player.isBot)
			.map(player => this.userService.findLevelByLogin(player.socket.data.user.login));

		const levels = await Promise.all(levelPromises);

		const state = {
			roomName: room.roomName,
			pongTheme: room.pongTheme,
			getBall: room.getBall,
			ball: room.ball,
			player: allPlayers.map((player, index) => ({
				paddlePosition: player.paddlePosition,
				score: player.score,
				username: player.isBot
					? "IA " + room.levelIA
					: (player.socket && player.socket.data && player.socket.data.user)
						? player.socket.data.user.username
						: 'Unknown Player',
				avatar: player.isBot
					? "avatar.png"
					: (player.socket && player.socket.data && player.socket.data.user)
						? player.socket.data.user.avatar
						: null,
				level: player.isBot ? -1 : levels[index],
				isBot: player.isBot,
			})),
		};

		for (let player of allPlayers) {
			if (player.socket) {
				player.socket.emit('sendUpdateNotif', state);
			}
		}
	}

	updateIA(room: GameData) {

		if (room.levelIA === 'easy') {
			const paddleHeightPercent = 0.25;

			room.updateIntervalIA = setInterval(() => {

				const ballY = room.ball.position.y;
				const newY = ballY - (paddleHeightPercent * 0.75);

				const clampedY = Math.max(paddleHeightPercent / 2, Math.min(1 - paddleHeightPercent / 2, newY));
				this.movePaddleIA(room, clampedY);
			}, 16);
		}

		else if (room.levelIA === 'medium') {
			const paddleHeightPercent = 0.25;

			room.updateIntervalIA = setInterval(() => {

				const ballY = room.ball.position.y;

				const newY = ballY - (paddleHeightPercent * 0.5);
				const clampedY = Math.max(paddleHeightPercent / 2, Math.min(1 - paddleHeightPercent / 2, newY));
				this.movePaddleIA(room, clampedY);
			}, 16);
		}
		else if (room.levelIA === 'hard') {
			const paddleHeightPercent = 0.25;

			room.updateIntervalIA = setInterval(() => {
				const ballY = room.ball.position.y;
				const newY = ballY;
				const clampedY = Math.max(paddleHeightPercent / 2, Math.min(1 - paddleHeightPercent / 2, newY));
				this.movePaddleIA(room, clampedY);
			}, 16);
		}

	}

	async sendPadleNotif(room: GameData) {

		let allPlayers = [...room.players.values()];

		if (room.bots && room.bots.size > 0) {
			allPlayers = [...allPlayers, ...room.bots.values()];
		}

		const levelPromises = allPlayers
			.filter(player => !player.isBot)
			.map(player => this.userService.findLevelByLogin(player.socket.data.user.login));

		const levels = await Promise.all(levelPromises);


		const state = {
			roomName: room.roomName,
			pongTheme: room.pongTheme,
			ball: room.ball,
			getBall: room.getBall,
			player: allPlayers.map((player, index) => ({
				paddlePosition: player.paddlePosition,
				score: player.score,
				username: player.isBot
					? "IA " + room.levelIA
					: (player.socket && player.socket.data && player.socket.data.user)
						? player.socket.data.user.username
						: 'Unknown Player',
				avatar: player.isBot
					? "avatar.png"
					: (player.socket && player.socket.data && player.socket.data.user)
						? player.socket.data.user.avatar
						: null,
				level: player.isBot ? -1 : levels[index],
				isBot: player.isBot
			})),
		}

		for (let player of allPlayers) {
			if (player.socket) {
				player.socket.emit('sendPadleNotif', state);
			}
		}
	}




	joinPlayer(room: GameData, socket: Socket, isBot: boolean) {

		if (isBot) {
			room.bots.set(room.iaId, {
				paddlePosition: 0.5,
				score: 0,
				socket: null,
				isBot,
				level: 1,
			})
		}

		else {
			if (socket.data && socket.data.user) {
				socket.data.roomName = room.roomName;
				room.players.set(socket, {
					paddlePosition: 0.5,
					score: 0,
					socket,
					isBot,
					level: socket.data.user.level,
				})
			}
		}
	};


	async checkStartorWait(room: GameData, player: string, mySocket: Socket) {

		const data = {
			player,
			roomName: room.roomName
		}

		if (room.players.size === 2) {
			mySocket.emit('inGameNotif', mySocket.data.user.login);
			this.sendUpdateNotif(room);
			this.startGame(room, false, '');
		}
		else {
			mySocket.emit('waitingRoom', data);
		}
	}

	movePaddle(room: GameData, socket: Socket, posY: number): void {
		const playerData = room.players.get(socket);

		if (playerData) {
			playerData.paddlePosition = posY;
			this.sendPadleNotif(room);
		}
	}

	movePaddleIA(room: GameData, posY: number): void {
		const BotData = room.bots.get(room.iaId);
		if (BotData) {
			BotData.paddlePosition = posY;
			this.sendPadleNotif(room);
		}
	}

	getInitialBallDirection(room: GameData): Vector {
		let angle: number;
		let horizontalDirection: number;
	
		const minAngle = Math.PI / 2 - (2 * Math.PI / 9); // 20 degrees in radians relative to the horizontal axis
		const maxAngle = Math.PI / 2 - (7 * Math.PI / 18); // 70 degrees in radians relative to the vertical axis
		angle = minAngle + Math.random() * (maxAngle - minAngle);
	
		if (room.lastScorer) {
			horizontalDirection = room.lastScorer === 'left' ? -1 : 1;
		} else {
			horizontalDirection = Math.random() < 0.5 ? -1 : 1;
		}
	
		const x = Math.cos(angle) * horizontalDirection;
		const y = Math.sin(angle) * (Math.random() < 0.5 ? -1 : 1); // Randomize vertical direction
		room.getBall = x < 0 ? 'right' : 'left';
	
		return new Vector(x, y).normalize();
	}
	
	
	


	private updateBallPosition(roomName: string): void {
		const ballSizeWidth = 0.02;
		const ballSizeHeight = 0.04;
		const paddleWidthPercent = 0.020;
		const paddleHeightPercent = 0.25;
		const room = this.getRoom(roomName);
		if (!room || !room.ball || !room) {
			console.error(`Room or ball is undefined for roomName: ${roomName}`);
			clearInterval(room.updateInterval);
			clearInterval(room.updateIntervalIA);
			return;
		}

		room.ball.position.x += room.ball.direction.x * room.moveAmount;
		room.ball.position.y += room.ball.direction.y * room.moveAmount;

		const leftPaddle = room.players.values().next().value;
		let rightPaddle;

		if (room.bots && room.bots.size > 0) {
			rightPaddle = room.bots.values().next().value;
		} else {
			rightPaddle = [...room.players.values()][1];
		}
		if (!leftPaddle || !rightPaddle)
			return ;

		const paddleAdjustment = paddleHeightPercent / 2;

		if (room.ball.position.y <= 0 || room.ball.position.y + ballSizeHeight >= 1) {
			room.ball.direction.y = -room.ball.direction.y;
		}

		if (
			room.ball.position.x <= paddleWidthPercent &&
			room.ball.position.y + ballSizeHeight >= leftPaddle.paddlePosition - paddleAdjustment &&
			room.ball.position.y <= leftPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment
		) {
			room.setgetBall('left');

			room.ball.direction.x = -room.ball.direction.x;
			room.ball.position.x = paddleWidthPercent;
			room.moveAmount += 0.0005;
			if (room.ball.position.y + ballSizeHeight - (leftPaddle.paddlePosition - paddleAdjustment) < ballSizeHeight / 2) {
				room.ball.position.y = leftPaddle.paddlePosition - paddleAdjustment - ballSizeHeight;
			} else if ((leftPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment) - room.ball.position.y < ballSizeHeight / 2) {
				room.ball.position.y = leftPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment;
			}
		}

		if (
			room.ball.position.x + ballSizeWidth >= 1 - paddleWidthPercent &&
			room.ball.position.y + ballSizeWidth >= rightPaddle.paddlePosition - paddleAdjustment &&
			room.ball.position.y <= rightPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment
		) {
			room.setgetBall('right');

			room.ball.direction.x = -room.ball.direction.x;
			room.ball.position.x = 1 - paddleWidthPercent - ballSizeWidth;
			room.moveAmount += 0.0005;
			if (room.ball.position.y + ballSizeHeight - (rightPaddle.paddlePosition - paddleAdjustment) < ballSizeHeight / 2) {
				room.ball.position.y = rightPaddle.paddlePosition - paddleAdjustment - ballSizeHeight;
			} else if ((rightPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment) - room.ball.position.y < ballSizeHeight / 2) {
				room.ball.position.y = rightPaddle.paddlePosition + paddleHeightPercent - paddleAdjustment;
			}
		}

		if (room.ball.position.x <= 0) {
			rightPaddle.score++;
			room.lastScorer = 'right';
			this.checkGameFinish(room);
			this.resetBallAndStartAgain(room);
			room.moveAmount = 0.005;
		}

		if (room.ball.position.x + ballSizeWidth >= 1) {
			leftPaddle.score++;
			room.lastScorer = 'left';
			this.checkGameFinish(room);
			this.resetBallAndStartAgain(room);
			room.moveAmount = 0.005;
		}

		this.sendPadleNotif(room);
	}

	private async checkGameFinish(room: GameData) {
		const winningScore = room.getPongSet();

		const leftPaddle = room.players.values().next().value;
		let rightPaddle;
		if (room.bots && room.bots.size > 0) {
			rightPaddle = room.bots.values().next().value;
		} else {
			rightPaddle = [...room.players.values()][1];
		}

		const [playerOne, playerTwo] = [...room.players.values()];


		if (leftPaddle.score >= winningScore || rightPaddle.score >= winningScore) {
			const winner = leftPaddle.score >= winningScore ? leftPaddle : rightPaddle;
			const loser = leftPaddle.score >= winningScore ? rightPaddle : leftPaddle;

			 room.eventBody = {
				winnerScore: winner.score,
				loserScore: loser.score,
				winnerUsername: winner.isBot ? "IA" + room.levelIA : winner.socket.data.user.username,
				loserUsername: loser.isBot ? "IA" + room.levelIA : loser.socket.data.user.username,
				isFinish: true
			};
			for (let [_, player] of room.players) {
				player.socket.emit('finishGame', room.eventBody);
				player.socket.data.roomName = undefined;
				await this.userService.updateStatus(player.socket.data.user.login, 'online');
				player.socket.emit('inGameNotif', player.socket.data.user.login);
			}


			clearInterval(room.countdownInterval);
			clearInterval(room.updateInterval);
			clearInterval(room.updateIntervalIA);

			room.updateInterval = undefined;
			this.allGameRooms.delete(room.roomName);

			try {
				// Check if the second player is a bot based on the presence of room.bots
				const isPlayerTwoBot = !!(room.bots && room.bots.size > 0);

				await this.userService.addMatch(playerOne.socket.data.user.id, isPlayerTwoBot ? null : playerTwo.socket.data.user.id, leftPaddle.score, rightPaddle.score);
				if (!isPlayerTwoBot) {
					await this.userService.addMatch(playerTwo.socket.data.user.id, playerOne.socket.data.user.id, rightPaddle.score, leftPaddle.score);
				}
				else {
					clearInterval(room.updateIntervalIA);
				}
				return { message: 'Match added successfully.' };
			} catch (error) {
			}
		}
	}

	private resetBallAndStartAgain(room: GameData): void {
		room.ball.position.x = 0.5;
		room.ball.position.y = 0.5;
		room.ball.direction = this.getInitialBallDirection(room);
		this.sendPadleNotif(room);
	}

	startGame(room: GameData, isBot: Boolean, levelIA: string): void {

		if (!room) {
			for (let [_, player] of room.players) {
				if (player.socket) {
					player.socket.emit("gameDeleted");
				}
			}
			return;
		}
		let countdown = 5;

		room.countdownInterval = setInterval(() => {

			for (let [_, player] of room.players) {
				if (player.socket) {
					player.socket.emit('gameCountdown', { countdown });
				}
			}

			countdown--;

			if (countdown < 0) {
				clearInterval(room.countdownInterval);
				room.ball.direction = this.getInitialBallDirection(room);
				room.updateInterval = setInterval(() => this.updateBallPosition(room.roomName), 16);

				if (isBot) {

					this.updateIA(room);
				}
			}
		}, 1000);

	}
}

