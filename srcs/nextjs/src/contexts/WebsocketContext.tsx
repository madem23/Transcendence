import { FetchingUser, FetchingUserDeleteFriend, FriendRequestType, GameEventBody, Message, UsernameChangeType, PrivateRoomRequestType } from '@/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserContext } from './UserContext';
import { useRoomContext } from './RoomContext';
import axios from 'axios'
import { toast } from '@/components/ui/Toast';
import { achievementsData } from '@/components/achievements';
import { atoast } from '@/ui/ToastAchievement';
import { useRouter } from 'next/router';
import Paragraph from '@/components/ui/Paragraph';
import Button from '@/components/ui/Button';
import { useGameContext } from './GameContext';
import { useRef } from 'react';
import AnimPongRetro from '@/components/ui/AnimPongRetro';
import Modal from 'react-modal';
import SignOutButton from '@/components/ui/SignoutButton';
import useAuthStatus from '@/hooks/useAuthStatus';

// let socket: Socket;

let WebsocketContext = createContext<Socket | undefined>(undefined);

async function getConfig() {

	try {
		const response = await fetch(`/api/config`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',

		});
		if (response.ok) {
			const resBody = await response.json();
			return { host: resBody.host, port: resBody.nestjsport }
		}
		else {
			return { host: location.hostname, port: '3001' }
		}

	} catch (error) {
		return { host: location.hostname, port: '3001' }
	}
}


export const useWebsocketContext = () => {
	return useContext(WebsocketContext);
}

export const WebsocketContextProvider = ({ children }: { children: ReactNode }) => {
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const { user, isGameModalOpen, setIsGameModalOpen, logs, setLogs, updateUser } = useUserContext();
	const { activeRoom, setNewMessage, setRoomMessages, toggleUpdate, changeRoom } = useRoomContext();
	const router = useRouter();
	const [isModalOpen, setModalOpen] = useState(false);
	const [isModalFL, setModalFL] = useState(false);
	const [modalContent, setModalContent] = useState<any>(null);
	const [isInviteAccepted, setIsInviteAccepted] = useState(false);
	const [isAGameRequest, setIsAGameRequest] = useState(false);
	const [timeRemaining, setTimeRemaining] = useState(20);
	const timerIdRef = useRef<any>(null);
	const [isModalMatchmakingOpen, setModalMatchmakingOpen] = useState(false);
	const [modalContentMatchmaking, setModalContentMatchmaking] = useState<any>(null);
	const [modalCouldown, setModalCouldown] = useState(false);
	const [isWaitingRoomModalOpen, setWaitingRoomModalOpen] = useState(false);
	const [timeRemainingStart, setTimeRemainingStart] = useState(null);
	const [blockingAccess, setBlockingAccess] = useState<boolean>(false);
	// const isLoggedIn = useAuthStatus();
	const [friendRequests, setFriendRequests] = useState<FriendRequestType[]>([]); // Initialize as an empty array

	const [privateRoomRequests, setPrivateRoomRequests] = useState<PrivateRoomRequestType[]>([]);



	const [isModalGameFinish, setModalGameFinish] = useState(false);
	const [modalContentGameFinish, setModalContentGameFinish] = useState<any>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [waitingRoomModalContent, setWaitingRoomModalContent] = useState({
		title: '',
		message: '',
	});

	async function init() {
		try {
			const config = await getConfig();

			setSocket(io(`http://${config.host}:${config.port}`));
		} catch (error) {
			console.error('Error:', error);
		}

	}
	useEffect(() => {
		init();
	}, [])


	const { setGameState } = useGameContext();

	const handleCloseModal = () => {
		setModalMatchmakingOpen(false);
		socket?.emit('cancelMatchmaking');
	}

	const handleCloseModalGameFinish = () => {
		setModalGameFinish(false);
		setIsGameModalOpen(false);
		router.push('/home');

	}

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};


	useEffect(() => {
		if (blockingAccess === true) {
			setIsGameModalOpen(true);
		} else {
			setIsGameModalOpen(false);
		}
	}, [blockingAccess]);

	useEffect(() => {
		let intervalId: NodeJS.Timeout;
		if (isWaitingRoomModalOpen || isModalOpen) {
			intervalId = setInterval(() => {
				setTimeRemaining(time => Math.max(time - 1, 0));
			}, 1000);
		}
		return () => clearInterval(intervalId);
	}, [isWaitingRoomModalOpen, isModalOpen]);



	useEffect(() => {
		friendRequests.forEach((request) => {
			setModalContent({
				title: 'Friend Request',
				message: `You were invited to friend ${request.senderUsername}`,
				onAccept: () => {
					AddFriend({ name: request.senderUsername, id: request.senderID });
					socket?.emit('friendAccepted', {
						name: request.senderUsername,
						id: request.senderID,
					});
					closeFriendRequest(request);
					setModalFL(false);
				},
				onReject: () => {
					toast({
						title: 'Success',
						message: 'You rejected the invitation successfully',
						type: 'success',
					});
					setModalFL(false);
					closeFriendRequest(request);
				},
			});
			setModalGameFinish(false);
			setModalFL(true);
		});
	}, [friendRequests]);

	//Modal
	useEffect(() => {
		privateRoomRequests.forEach((request) => {
			setModalContent({
				title: 'Private Room Request',
				message: `You were invited to join ${request.roomName} by ${request.senderUsername}`,
				onAccept: () => {
					axios.patch(`/api/rooms/setUser`, {
						roomName: request.roomName,
						login: user.login,
						status: 'normal',
					}).catch(error => console.error(error));
					socket?.emit('joinRoom', request.roomName);
					socket?.emit('announce', {
						roomName: request.roomName,
						content: `${user.username} joined the room`,
					});
					socket?.emit('chatUpdate');
					if (router.pathname !== '/chat')
						router.push('/chat');
					changeRoom(request.roomName); // doesn't work properly because of the time it takes to join the room
					closePrivateRoomRequest(request);
					setModalFL(false);
				},
				onReject: () => {
					toast({
						title: 'Success',
						message: 'You rejected the private room invitation successfully',
						type: 'success',
					});
					setModalFL(false);
					closePrivateRoomRequest(request);
				},
			});
			setModalGameFinish(false);
			setModalFL(true);
		});
	}, [privateRoomRequests]);



	/* After rejecting the request, remove it from the array of pending friend requests */
	const closeFriendRequest = (request: FriendRequestType) => {
		setFriendRequests((prevRequests) => prevRequests.filter((r) => r !== request));
	};

	/* After accepting the request, remove it from the array of pending friend requests */
	const closePrivateRoomRequest = (request: PrivateRoomRequestType) => {
		setPrivateRoomRequests((prevRequests) => prevRequests.filter((r) => r !== request));
	};


	const AddFriend = async (friend: FetchingUser) => {
		try {
			const response = await fetch(`/api/users/add-friend`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: friend.id,
				}),
				credentials: 'include',
			});
			const responseJson = await response.json();
			if (response.ok && responseJson.ach === true) {
				const achObj = achievementsData.find(ach => ach.name === 'first_friend');
				if (achObj) {
					atoast({
						title: achObj.title,
						message: achObj.message,
						link: achObj.link,
						type: 'success',
					});
				} else {

				}
			}
			else if (response.ok && responseJson.ach === false) {
				toast({
					title: "Success",
					message: `Cool! You have friended ${friend.name}`,
					type: "success"
				});
			}
			else {
				toast({
					title: "Error",
					message: `Sorry, ${responseJson.message}`,
					type: "error"
				});
			}
		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	/* Passive deletion : in case of removal of friend list by a friended user */
	const DeleteFriend = async (friend: FetchingUserDeleteFriend) => {
		try {
			if (user.friends.includes(friend.login)) {
				const response = await fetch(`/api/users/delete-friend`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						id: friend.id
					}),
					credentials: 'include',
				});
			}
		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	function addLog(message: string, type: string) {
		const currentDate = new Date();
		const log = {
			time: currentDate.toLocaleString(),
			message: message,
			type: type,
		}
		setLogs((prevLogs) => { //keeping maximum 100 logs in user context
			if (prevLogs.length >= 100) {
				return [...prevLogs.slice(1), log];
			} else {
				return [...prevLogs, log];
			}
		});
	}

	useEffect(() => {
		/* Configuring the socket with the user once the user data is ready/updated (+ changing online status) */
		if (user.id !== undefined && user.id !== -1) {

			socket?.emit('setSocketUser', {
				user: { ...user }
			});
		}
		/* Checking if User is online before letting the socket listening for events */
		if (user.id !== undefined && user.id !== -1 && user.status !== 'offline') {
			socket?.on('userLoggedOut', (username: string) => {
				if (user.username && username !== user.username) {
					addLog(`${username} has logged out.`, 'normal');
				}
				else if (user.username && username == user.username) {
					setBlockingAccess(false);
					// router.push('/');
				}
				else
					addLog(`${username} has been disconnected.`, 'normal');
			});
			socket?.on('userLoggedIn', (username: string) => {
				if (user.username && username !== user.username)
					addLog(`${username}has logged in.`, 'normal');
			});
			socket?.on('newFriend', (username: string) => {
				addLog(`You have friended ${username}.`, 'highlight');
			});

			socket?.on('FriendDeleted', (username: string) => {
				addLog(`${username} is no more your friend.`, 'normal');
			});

			/* You have finished a game */
			socket?.on('finishGame', (gameEvent: GameEventBody | null) => {
				setModalCouldown(false);

				router.push('/home');
				setGameState(undefined);
				socket?.emit('gameFinished', gameEvent);

				if (gameEvent) {
					setTimeout(() => {
						setModalGameFinish(true);
						setModalContentGameFinish({
							winner: {
								username: gameEvent.winnerUsername,
								score: gameEvent.winnerScore
							},
							loser: {
								username: gameEvent.loserUsername,
								score: gameEvent.loserScore
							}
						});
					}, 1000);
					addLog(` ${gameEvent.winnerUsername === user.username ? 'You' : gameEvent.winnerUsername} won a game against ${gameEvent.loserUsername === user.username ? 'you' : gameEvent.loserUsername} (${gameEvent.winnerScore} - ${gameEvent.loserScore})`, 'hightlight');
				}
				else if (gameEvent === null) {
					addLog('game interrupted', 'normal');
					toast({
						title: "OUPS",
						message: "it seems that the game has ended early",
						type: "success"
					})
				}
			})

			/* SOMEONE has started a game */
			socket?.on('onGameStarted', () => {
				addLog(`a game has started`, 'normal');
			});

			/* SOMEONE has finished a game */
			socket?.on('onGameFinished', (gameEvent: GameEventBody | null) => {
				if (gameEvent && (gameEvent?.winnerUsername !== user.username && gameEvent?.loserUsername !== user.username)) {
					addLog(` ${gameEvent.winnerUsername} won a game against ${gameEvent.loserUsername} (${gameEvent.winnerScore} - ${gameEvent.loserScore})`, 'hightlight');
				}
				else {
					addLog('game interrupted', 'normal');
				}
			});

			/* SOMEONE has finished a game */
			socket?.on('gameAborted', () => {
				setGameState(undefined);
				socket?.emit('gameFinished', null);
			});

			socket?.on('tabDisconnected', () => {
				setBlockingAccess(false);
			});

			socket?.on('onForbiddenAccess', () => {
				setBlockingAccess(true);
			});
			socket?.on('onMessage', (newMessage: Message) => {
				if (user.blocked_users.includes(newMessage.senderLogin))
					return;
				setRoomMessages(prev => {
					const updatedMessages = [...(prev[newMessage.room] || []), newMessage];
					return { ...prev, [newMessage.room]: updatedMessages };
				});
				if (activeRoom !== newMessage.room) {
					setNewMessage(prev => {
						return { ...prev, [newMessage.room]: true };
					});
				}
			});

			socket?.on('onUsernameChange', (body: UsernameChangeType) => {
				addLog(`${body.oldName === user.username ? 'You are ' : body.oldName + ' is '} now called ${body.newName}`,
					'highlight');
			});

			socket?.on('onConfirmationFriendRequest', (newFriend) => {
				AddFriend(newFriend);
			});

			socket?.on('onAlreadyFriend', (friend) => {
				toast({
					title: "Oups !",
					message: `${friend} is already your friend`,
					type: "error"
				});
			});
			socket?.on('onFriendDelete', (toDelete) => {
				DeleteFriend(toDelete);
			});

			socket?.on('invitationToJoinaGameSend', inviteSend => {
				if (user.blocked_users.includes(inviteSend.playerSenderLogin))
					return;
				setModalGameFinish(false);
				setIsAGameRequest(true);
				const id = setTimeout(() => {
					setModalOpen(false);
					setTimeRemaining(20);
				}, 20000);
				timerIdRef.current = id;
				setModalContent({
					title: 'Challenge Request',
					message: `${inviteSend.playerSender} wants to challenge you`,
					onAccept: () => {
						setIsInviteAccepted(true);
						socket?.emit('acceptGameInvite', { roomName: inviteSend.roomName, username: user.username });
						setModalOpen(false);
					},
					onReject: () => {

						socket?.emit('declineGameInvite', { roomName: inviteSend.roomName, challengerId: inviteSend.playerSenderId });
						toast({
							title: "Success",
							message: "You rejected the invitation successfully",
							type: "success"
						});
						setModalOpen(false);
						setTimeRemaining(20);
					}
				});
				; setModalOpen(true);
			});

			socket?.on('yourGameRequestDeclined', () => {
				setWaitingRoomModalOpen(false);
				if (timerIdRef.current) {
					clearTimeout(timerIdRef.current);
					timerIdRef.current = null;
				}
				setTimeRemaining(20);
				toast({
					title: "Challenge declined",
					message: "This player does not want to play right now",
					type: "success"
				});
			});

			/* This player is in game */
			socket?.on('inGameNotif', (player) => { //login
				socket?.emit("gameStarted");
			});


			socket?.on('waitingRoom', waitingRoom => {
				const id = setTimeout(() => {
					socket?.emit("invitExpire", waitingRoom);
					setWaitingRoomModalOpen(false);
					setTimeRemaining(20);
				}, 20000);
				timerIdRef.current = id;

				setWaitingRoomModalContent({
					title: 'Waiting Room',
					message: `Waiting for ${waitingRoom.player} to accept the challenge...`,
				});
				setWaitingRoomModalOpen(true);
			});

			socket?.on('sendUpdateNotif', updateNotif => { //accepting game
				setWaitingRoomModalOpen(false);
				setModalMatchmakingOpen(false);
				setTimeRemaining(20);
				if (timerIdRef.current) {
					clearTimeout(timerIdRef.current);
					timerIdRef.current = null;
				}
				setGameState(updateNotif);
				if (router.pathname !== '/game') {
					router.push('/game');
				}
			});

			socket?.on('sendPadleNotif', updateNotif => {
				setGameState(updateNotif);
			});

			socket?.on('errorToast', errorToast => {
				toast({
					title: errorToast.title,
					message: errorToast.message,
					type: "error"
				})
			})

			socket?.on('waitingRoomMatchmaking', waitingRoomMatchmaking => {
				setModalContentMatchmaking({
					title: 'Matchmaking launched',
					message: `Waiting for a challenger ...`,
				});
				setModalMatchmakingOpen(true);
			})

			socket?.on('matchFound', matchFound => {
				toast({
					title: "BE READY !",
					message: "match will start !",
					type: "success"

				})
			})
			socket?.on('gameCountdown', (data) => {
				const { countdown } = data;
				setTimeRemainingStart(countdown);

				if (countdown === 5) {
					setModalCouldown(true);
				}

				if (countdown <= 0) {
					setModalCouldown(false);
				}
			});

			socket?.on('refreshDM', (senderLogin: string, senderUsername: string) => {
				if (user.blocked_users.includes(senderLogin))
					return;
				if (activeRoom !== senderUsername) {
					setNewMessage(prev => {
						return { ...prev, [senderUsername]: true };
					});
				}
				updateUser();
			});

			socket?.on('forceChangeRoom', (room: string) => {
				if (router.pathname === '/chat') {
					changeRoom(room);
				}
			});

			socket?.on('onInvite', invite => {
                switch (invite.type) {
                    case "privateRoom":
                        if (user.blocked_users.includes(invite.sender))
                            return;
                        const inviteRoomDetails: PrivateRoomRequestType = {
                            senderUsername: invite.senderName,
                            roomName: invite.room,
                        }
                        setPrivateRoomRequests((prevRequests) => [...prevRequests, inviteRoomDetails]);
                        break;

                    case "friend":
                        if (user.blocked_users.includes(invite.sender.login))
                            return;
                        const inviteDetails: FriendRequestType = {
                            senderUsername: invite.sender.name,
                            senderID: invite.sender.id,
                        }

                        setFriendRequests((prevRequests) => {
                            const duplicateIndex = prevRequests.findIndex(
                                (request) => request.senderID === inviteDetails.senderID
                            );
                            if (duplicateIndex !== -1) {
                                const updatedRequests = [...prevRequests];
                                updatedRequests[duplicateIndex] = inviteDetails;
                                return updatedRequests;
                            } else {
                                return [...prevRequests, inviteDetails];
                            }
                        });
                        break;
                }
            });

			const joinRooms = async () => {
				try {
					const rooms = await axios.get(`/api/rooms`);
					rooms.data.forEach((room: any) => {
						if (room.users[user.login]) {
							socket?.emit('joinRoom', room.name);
						}
					});
				} catch (error) {
					console.error(error);
				}
				toggleUpdate();
			}
			joinRooms();
		}
		return () => {
			socket?.removeAllListeners('onMessage');
			socket?.removeAllListeners('onConfirmationFriendRequest');
			socket?.removeAllListeners('onAlreadyFriend');
			socket?.removeAllListeners('onFriendDelete');
			socket?.removeAllListeners('invitationToJoinaGameSend');
			socket?.removeAllListeners('sendUpdateNotif');
			socket?.removeAllListeners('errorToast');
			socket?.removeAllListeners('gameFinish');
			socket?.removeAllListeners('onFinishedGame');
			socket?.removeAllListeners('onStartedGame');
			socket?.removeAllListeners('waitingRoom');
			socket?.removeAllListeners('yourGameRequestDeclined');
			socket?.removeAllListeners('inGameNotif');
			socket?.removeAllListeners('onForbiddenAccess');
			socket?.removeAllListeners('tabDisconnected');
			socket?.removeAllListeners('waitingRoomMatchmaking');
			socket?.removeAllListeners('matchFound');
			socket?.removeAllListeners('gameCountdown');
			socket?.removeAllListeners('onInvite');
			socket?.removeAllListeners('userLoggedOut');
			socket?.removeAllListeners('userLoggedIn');
			socket?.removeAllListeners('newFriend');
			socket?.removeAllListeners('FriendDeleted');
			socket?.removeAllListeners('finishGame');
			socket?.removeAllListeners('gameAborted');
			socket?.removeAllListeners('updateUser');
			socket?.removeAllListeners('forceChangeRoom');
			socket?.removeAllListeners('onGameStarted');
			socket?.removeAllListeners('onGameFinished');
			socket?.removeAllListeners('onUsernameChange');
			socket?.removeAllListeners('sendPadleNotif');
			socket?.removeAllListeners('refreshDM');
		}
	}, [user, socket, activeRoom]);


	return (
		<>
			<WebsocketContext.Provider value={socket}>
				{children}
			</WebsocketContext.Provider>

			{isModalOpen && (
				<div className="modal">
					<div className="modal-content px-8 pb-4 pt-2">
						<Paragraph neon='magenta'>{modalContent.title}</Paragraph>
						<Paragraph>{modalContent.message}</Paragraph>
						{isAGameRequest && (
							<Paragraph>Time Remaining: {timeRemaining}s</Paragraph>
						)}
						<div className='flex justify-center gap-5'>
							<Button onClick={modalContent.onAccept}>Accept</Button>
							<Button onClick={modalContent.onReject}>Reject</Button>
						</div>
					</div>
				</div>
			)}

			{isModalFL && (
				<div className="modal">
					<div className="modal-content px-8 pb-4 pt-2">
						<Paragraph neon='magenta'>{modalContent.title}</Paragraph>
						<Paragraph>{modalContent.message}</Paragraph>

						<div className='flex justify-center gap-5'>
							<Button onClick={modalContent.onAccept}>Accept</Button>
							<Button onClick={modalContent.onReject}>Reject</Button>
						</div>
					</div>
				</div>
			)}

			{isWaitingRoomModalOpen && (
				<div className="modal">
					<div className="modal-content px-8 pb-4 pt-2">
						<Paragraph neon='magenta'>{waitingRoomModalContent.title}</Paragraph>
						<Paragraph>{waitingRoomModalContent.message}</Paragraph>
						<Paragraph>Time Remaining: {timeRemaining}s</Paragraph>
					</div>
				</div>
			)}

			{isModalMatchmakingOpen && (
				<div className="modal">
					<div className="modal-content p-4 relative">
						<button
							onClick={handleCloseModal}
							style={{
								position: 'absolute',
								top: '10px',
								left: '10px',
								color: 'white',
								background: 'none',
								border: 'none',
								fontSize: '1rem',
								cursor: 'pointer',
								filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'
							}}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							<img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
						</button>

						<Paragraph neon='magenta'>{modalContentMatchmaking.title}</Paragraph>
						<Paragraph>{modalContentMatchmaking.message}</Paragraph>
						<AnimPongRetro />
					</div>
				</div>
			)}
			{modalCouldown && (
				<div className="modal">
					<div className="modal-content px-8 pb-4 pt-2">
						<Paragraph neon='magenta'>Starting game in...</Paragraph>
						<Paragraph>{timeRemainingStart} seconds</Paragraph>
					</div>
				</div>
			)}
			{isGameModalOpen && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative'>
						{ }
						<div className="font">ACCESS FORBIDDEN</div>
						<Paragraph>you are already connected on another tab. Try connecting with another account</Paragraph>

					</div>
				</div>
			)}

			{isModalGameFinish && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 max-w-[300px] relative'>
						<button
							onClick={handleCloseModalGameFinish}
							style={{
								position: 'absolute',
								top: '10px',
								left: '10px',
								color: 'white',
								background: 'none',
								border: 'none',
								fontSize: '1rem',
								cursor: 'pointer',
								filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'
							}}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							<img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
						</button>
						<p className='font text-center'>GAME RESULT</p>
						{modalContentGameFinish && (
							<>
								<p className=' font-press-start-2p text-[18px] text-center  text-white'>{modalContentGameFinish.winner.username === user.username ? 'CONGRATULATIONS YOU WON!' : 'SORRY YOU LOST'}</p>
								<div className='  text-center '>
									<div className='text-center  w-full'>
										<p className=' font-press-start-2p text-[16px] text-center  text-white text-shadow-blue mb-2'>WINNER</p>
										<p className='font-press-start-2p text-[14px] text-center text-ellipsis  overflow-x-hidden text-white mb-3'>{modalContentGameFinish.winner.username}</p>
									</div>
									<p className='font-press-start-2p text-[14px] text-white text-center mb-3'>{modalContentGameFinish.winner.score} - {modalContentGameFinish.loser.score}</p>
									<div className=' text-center gap-5 w-full'>
										<p className=' font-press-start-2p text-[16px] text-center text-white text-shadow-blue mb-2'>LOSER</p>
										<p className='font-press-start-2p text-[14px] text-ellipsis text-center overflow-x-hidden text-white'>{modalContentGameFinish.loser.username}</p>
									</div>
								</div>

							</>
						)}
					</div>
				</div>
			)}
		</>
	);

}