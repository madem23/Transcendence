import { Body, Inject, OnModuleInit, UseGuards } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/users/users.service';
import { GameService } from '../game/game.service';
import { WebSocketUserGuard } from './gateway.guards';
import { GameEventBody, UsernameChangeType } from 'src/utils/types';
import { configVariables } from '../config-export';
import { ConfigService } from '@nestjs/config';

declare module 'socket.io' {
	interface Socket {
		roomName: string;
		user: {
			id: number,
			login: string,
			username: string,
			avatar: string;
			isInvited: boolean;
			level: number;
		}
	}
}

const myConfigVariables = configVariables(new ConfigService());

const origin = `http://${myConfigVariables.host}:${myConfigVariables.port}`;

@WebSocketGateway({
	cors: {
		origin: [origin],
	},
})
   
export class myGateway implements OnModuleInit, OnGatewayDisconnect {
	constructor(
		@Inject(UsersService) private readonly userService: UsersService,
		@Inject(GameService) private readonly gameService: GameService,
	) { }

	handleDisconnect(client: Socket) {
		const allGameRooms = this.gameService.getAllGameRooms();

		const index = this.gameService.matchmakingQueue.indexOf(client);
		if (index !== -1) {
			this.gameService.matchmakingQueue.splice(index, 1);
		}


		for (let [_, room] of allGameRooms) {
			if (room.players.has(client)) {
				this.gameService.deleteRoom(room.roomName, null);
			}
		}

		if (client.data.user) {
			this.userService.updateStatus(client.data.user.login, 'offline');
		}
		this.server.emit('userLoggedOut', client.data?.user?.username ? client.data?.user?.username : '');
	}

	@WebSocketServer()
	server: Server;

	onModuleInit() {
		this.server.on('connection', socket => {
			const date = new Date();
			this.server.emit('onMessage', {
				senderUsername: "Server",
				content: `(${date.toLocaleString('fr')}) A new user joined the server! socker.id = ${socket.id}`,
				date: date,
				time: `${date.getHours()}:${date.getMinutes()}`,
			})
		});
	}

	async changeStatusToOngame(login: string) {
		await this.userService.updateStatus(login, 'ongame');
		this.server.emit("onGameStarted");
	}

	@SubscribeMessage('gameFinished')
	@UseGuards(WebSocketUserGuard)
	onGameFinished(@MessageBody() event: GameEventBody | null) {
		this.server.emit('onGameFinished', event);
	}

	@SubscribeMessage('gameStarted')
	@UseGuards(WebSocketUserGuard)
	onGameStarted() {
		this.server.emit('onGameStarted');
	}

	@SubscribeMessage('userLogOut')
	onUserLogout(@MessageBody() body, @ConnectedSocket() sender: Socket) {
		sender.data.user = undefined; //resetting the socket to limit access after logout
		this.server.emit('userLoggedOut', body.user);
	}

	@SubscribeMessage('userLogIn')
	onUserLogin(@MessageBody() body) {
		this.server.emit('userLoggedIn', body.user);
	}

	@SubscribeMessage('newMessage')
	@UseGuards(WebSocketUserGuard)
	onNewMessage(@MessageBody() body, @ConnectedSocket() socket: Socket) {
		this.server.to(body.room).emit('onMessage', {
			senderLogin: body.senderLogin,
			senderUsername: body.senderUsername,
			role: body.role,
			content: body.content,
			date: body.date,
			time: body.time,
			room: body.room,
		});
	}

	@SubscribeMessage('messageOwn')
	onMessageOwn(@MessageBody() body, @ConnectedSocket() socket: Socket) {
		const date = new Date();
		socket.emit('onMessage', {
			senderUsername: "Server",
			room: body.roomName,
			content: body.content,
			date: date.toLocaleString('fr'),
			time: `${date.getHours()}:${date.getMinutes()}`,
		});
	}

	@SubscribeMessage('announce')
	onAnnounce(@MessageBody() body) {
		const date = new Date();
		this.server.to(body.roomName).emit('onMessage', {
			senderUsername: "Server",
			room: body.roomName,
			content: body.content,
			date: date.toLocaleString('fr'),
			time: `${date.getHours()}:${date.getMinutes()}`,
		});
	}

	@SubscribeMessage('setSocketUser') //no auth guard here
	async onSetSocketUser(@MessageBody() body, @ConnectedSocket() mySocket: Socket) {
		if (!mySocket.data.user) {
			for (let socket of await this.server.fetchSockets()) {
				if (socket.data.user && socket.data.user?.id && socket.data.user?.id === body.user.id) {
					this.server.to(mySocket.id).emit('onForbiddenAccess');
					return;
				}
			}
			mySocket.data.user = body.user;
			this.server.emit('tabDisconnected');
			if (!body.user.status || body.user.status === 'offline') {
				this.userService.updateStatus(body.user.login, 'online');
				this.server.emit('userLoggedIn', body.user.username);
			}
		}
	}

	@SubscribeMessage('joinRoom')
	onRoomJoin(@MessageBody() roomName: string, @ConnectedSocket() socket: Socket) {
		socket.join(roomName);
	}

	@SubscribeMessage('sendInvite')
	async onInvite(@MessageBody() body, @ConnectedSocket() sender) {
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.username && socket.data.user.username === body.target) {
				this.server.to(socket.id).emit('onInvite', {
					sender: sender.data.user.login,
					senderName: sender.data.user.username,
					type: body.type,
					room: body.room,
				});
				return;
			}
		});
	}

	@SubscribeMessage('sendFriendInvite')
	async onFriendInvite(@MessageBody() body, @ConnectedSocket() sender) {
		try {
			const isFriend = await this.userService.isFriend(sender.data.user.id, body.targetId);
			if (isFriend && sender && sender.id) {
				this.server.to(sender.id).emit('onAlreadyFriend', body.targetName);
				return;
			}
		} catch (error) {
			console.error(error);
		}
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.id && sender.data.user.username && socket.data.user.id === body.targetId) {
				this.server.to(socket.id).emit('onInvite', {
					sender: {
						name: sender.data.user.username,
						id: sender.data.user.id,
						login: sender.data.user.login,
					},
					type: body.type,
				});
				return;
			}
		});
	}

	/* Sender: user accepting the friend request */
	@SubscribeMessage('friendAccepted')
	async onFriendAccepted(@MessageBody() target, @ConnectedSocket() sender) {
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.id && socket.data.user.id === target.id) {
				this.server.to(socket.id).emit('onConfirmationFriendRequest', { /* new friend's info :*/
					id: sender.data.user.id,
					name: sender.data.user.username,
				});
				if (socket.id) {
					this.server.to(socket.id).emit('newFriend', sender.data.user.username);
					this.server.to(sender.id).emit('newFriend', target.name);
				}
				return;
			}
		});
	}

	@SubscribeMessage('friendDelete')
	async onFriendDelete(@MessageBody() target, @ConnectedSocket() sender) {
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.id && socket.data.user.id === target.id) {
				this.server.to(socket.id).emit('onFriendDelete', { /* to-remove friend's info :*/
					id: sender.data.user.id,
					name: sender.data.user.username,
					login: sender.data.user.login,
				});
				if (socket.id) {
					this.server.to(socket.id).emit('FriendDeleted', sender.data.user.username);
					this.server.to(sender.id).emit('FriendDeleted', target.name);
				}
				return;
			}
		});
	}

	@SubscribeMessage('usernameChange')
	async onUsernameChange(@MessageBody() body: UsernameChangeType, @ConnectedSocket() mySocket: Socket) {
		if (mySocket.data.user)
			mySocket.data.user.username = body.newName;
		this.server.emit('onUsernameChange', body);
	}

	@SubscribeMessage('messageOne')
	async onSingleMessage(@MessageBody() body) {
		const date = new Date();
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.username && socket.data.user.username === body.recipient) {
				this.server.to(socket.id).emit('onMessage', {
					senderUsername: "Server",
					content: body.content,
					room: body.roomName,
					time: `${date.getHours()}:${date.getMinutes()}`,
				});
				return;
			}
		});
	}

	@SubscribeMessage('refreshDM')
	async refreshDM(@Body() body) {
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.username && socket.data.user.username === body.recipient) {
				this.server.to(socket.id).emit('refreshDM', body.senderLogin, body.senderUsername);
				return;
			}
		});
	}

	@SubscribeMessage('kickSocket')
	async onKickSocket(@MessageBody() body) {
		const socketsOnServer = await this.server.fetchSockets();
		socketsOnServer.map(socket => {
			if (socket.data.user && socket.data.user.login && socket.data.user.login === body.kickedUser) {
				this.server.to(socket.id).emit('forceChangeRoom', '');
				socket.leave(body.roomName);
				return;
			}
		});
	}

	@SubscribeMessage('leaveRoom')
	onRoomLeave(@MessageBody() roomName: string, @ConnectedSocket() socket: Socket) {
		const date = new Date();
		socket.broadcast.to(roomName).emit('onMessage', {
			senderUsername: "Server",
			content: `${socket.data.user.login} left the room.`,
			room: roomName,
			time: `${date.getHours()}:${date.getMinutes()}`,
		});
		socket.leave(roomName);
	}

	@SubscribeMessage('clearRoom')
	onRoomDelete(@MessageBody() roomName: string) {
		this.server.socketsLeave(roomName);
	}

	@SubscribeMessage('chatUpdate')
	onChatUpdate() {
		this.server.emit('chatUpdate');
	}

	@SubscribeMessage('inviteGame')
	async inviteGame(
		@MessageBody() { playerId, pongTheme, pongSet }: { playerId: string; pongTheme: string; pongSet: number },
		@ConnectedSocket() mySocket: Socket,
	) {
		if (mySocket.data.roomName) {
			mySocket.emit('errorToast', { title: "Error", message: 'You are already in game' });
			return;
		}

		const roomName = this.gameService.createRoom(mySocket);
		const roomData = this.gameService.getRoom(roomName);

		roomData.setPongSet(pongSet);
		roomData.setPongTheme(pongTheme);

		let i = 0;
		for (let socket of await this.server.fetchSockets()) {
			if (socket.data.user && socket.data.user?.id && socket.data.user?.id == playerId && !socket.data.roomName) {
				if (socket.data.user.isInvited) {
					mySocket.emit('errorToast', { title: "Error", message: 'Sorry, this player is not available' });
					break;
				}
				i++;
				this.changeStatusToOngame(mySocket.data.user.login);
				this.gameService.checkStartorWait(roomData, socket.data.user.username, mySocket);

				socket.data.user.isInvited = true;
				socket.emit('invitationToJoinaGameSend', {
					roomName,
					playerSender: mySocket.data.user?.username,
					playerSenderId: mySocket.data.user?.id,
					playerSenderLogin: mySocket.data.user?.login,
				});
			}
		}
		if (i == 0) {
			this.gameService.deleteRoom(roomName, null);
		}
	}

	@SubscribeMessage('startIA')
	async startIA(@MessageBody() { isBot, pongTheme, pongSet, levelIA }: { isBot: Boolean; pongTheme: string; pongSet: number, levelIA: string }, @ConnectedSocket() mySocket: Socket) {
		if (mySocket.data.roomName) {
			mySocket.emit('errorToast', { title: "Error", message: 'You are alrdy in game' });
			return;
		}
		const roomName = this.gameService.createRoom(mySocket);
		const roomData = this.gameService.getRoom(roomName);
		roomData.setPongSet(pongSet);
		roomData.setPongTheme(pongTheme);
		roomData.levelIA = levelIA;
		this.gameService.joinPlayer(roomData, null, true);
		this.gameService.sendUpdateNotif(roomData);
		this.changeStatusToOngame(mySocket.data.user.login);
		this.gameService.startGame(roomData, isBot, levelIA);
	}

	@SubscribeMessage('acceptGameInvite')
	async acceptGameInvite(@MessageBody() body: { roomName: string, username: string }, @ConnectedSocket() mySocket: Socket) {
		mySocket.data.user.isInvited = false;
		const roomData = this.gameService.getRoom(body.roomName);
		this.gameService.joinPlayer(roomData, mySocket, false);
		this.changeStatusToOngame(mySocket.data.user.login);
		this.gameService.checkStartorWait(roomData, body.username, mySocket);
	}

	@SubscribeMessage('declineGameInvite')
	async declineGameInvite(@MessageBody() data: { roomName: string, challengerId: number }, @ConnectedSocket() mySocket: Socket) {
		mySocket.data.user.isInvited = false;

		this.gameService.deleteRoom(data.roomName, null);
		for (let socket of await this.server.fetchSockets()) {
			if (socket.data.user && socket.data.user?.id == data.challengerId) {
				socket.emit('yourGameRequestDeclined');
			}
		}
	}

	@SubscribeMessage('invitExpire')
	async inviteExpire(@MessageBody() room) {
		for (let socket of await this.server.fetchSockets()) {
			if (socket.data.user && socket.data.user?.username == room.player) {
				socket.data.user.isInvited = false;
			}
		}
		this.gameService.deleteRoom(room.roomName, null);
	}

	@SubscribeMessage('movePaddle')
	movePaddle(@MessageBody() data: { roomName: string, direction: string }, @ConnectedSocket() socket: Socket) {
		const gameData = this.gameService.getRoom(data.roomName);
		if (gameData) {

			const playerData = gameData.players.get(socket);
			if (!playerData) return;

			if (playerData.isBot === false) {
				const currentY = playerData.paddlePosition;
				const moveAmount = 0.02;
				const newY = data.direction === 'ArrowUp' ? currentY - moveAmount : currentY + moveAmount;
				const paddleHeight = 0.25;
				const clampedY = Math.max(paddleHeight / 2, Math.min(1 - paddleHeight / 2, newY));

				this.gameService.movePaddle(gameData, socket, clampedY);
			}
		}
	}

	@SubscribeMessage('leavePage')
	leavePage(@MessageBody() roomName: string, @ConnectedSocket() socket: Socket) {
		const actRoom = this.gameService.getRoom(roomName);
		if (actRoom) {
			for (let [_, player] of actRoom.players) {
				if (player.socket.data.user.login !== socket.data.user.login)
					player.socket.emit('gameFinish', null);
			}
		}
		if (actRoom && actRoom.eventBody === undefined)
			this.gameService.deleteRoom(roomName, null);
	}

	public matchmakingQueue: Socket[] = [];

	@SubscribeMessage('startMatchmaking')
	async startMatchmaking(@ConnectedSocket() mySocket: Socket) {
		if (mySocket.data.roomName || this.gameService.matchmakingQueue.includes(mySocket)) {
			mySocket.emit('errorToast', { title: "Error", message: 'You are already in matchmaking or in a game' });
			return;
		}
		this.gameService.matchmakingQueue.push(mySocket);

		mySocket.emit('waitingRoomMatchmaking');

		if (this.gameService.matchmakingQueue.length >= 2) {
			const player1Socket = this.gameService.matchmakingQueue.shift()!;
			const player2Socket = this.gameService.matchmakingQueue.shift()!;

			const roomName = this.gameService.createRoom(player1Socket);
			const room = this.gameService.getRoom(roomName);
			this.gameService.joinPlayer(room, player2Socket, false);

			player1Socket.emit('matchFound', { roomName });
			player2Socket.emit('matchFound', { roomName });
			this.gameService.sendUpdateNotif(room);
			this.changeStatusToOngame(player1Socket.data.user.login);
			this.changeStatusToOngame(player2Socket.data.user.login);
			this.gameService.startGame(room, false, '');
		}
	}

	@SubscribeMessage('cancelMatchmaking')
	async cancelMatchmaking(@ConnectedSocket() mySocket: Socket) {
		const index = this.gameService.matchmakingQueue.indexOf(mySocket);
		if (index !== -1) {
			this.gameService.matchmakingQueue.splice(index, 1);
			//mySocket.emit('matchmakingCanceled');
		}
	}


}



