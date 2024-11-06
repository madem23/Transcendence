import { FC } from 'react'
import Paragraph from '../ui/Paragraph';
import { useRoomContext } from '@/contexts/RoomContext';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import React, { useState } from 'react';
import axios from 'axios'
import { useUserContext } from '@/contexts/UserContext';
import { toast } from '@/ui/Toast';
import Button from '../ui/Button';
import { UserData } from '@/types';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import { achievementsData } from '@/components/achievements';
import { atoast } from "@/components/ui/ToastAchievement";


interface MessageInputProps {
	className?: string;
}

const MessageInput: FC<MessageInputProps> = ({ className }) => {
	const [messageContent, setMessageContent] = useState('');
	const socket = useWebsocketContext();
	const { activeRoom, isPM } = useRoomContext();
	const { user, updateUser } = useUserContext();

	const messageSubmit = async () => {
		if (!activeRoom) {
			toast({
				title: "NO ROOM JOINED",
				message: "Please join a room to send a message",
				type: "error"
			});
			setMessageContent('');
			return;
		}
		if (!isPM && activeRoom && messageContent[0] === "/") {
			parseAdminCommand();
		}
		else {
			if (isPM) {
				const date = new Date();

				await axios.put(`/api/users/updateDM`, {
					user1: user.username,
					user2: activeRoom,
					message: {
						senderLogin: user.login,
						senderUsername: user.username,
						content: messageContent,
						date: date.toLocaleString('fr'),
						time: date.getMinutes() < 10 ? `${date.getHours()}:0${date.getMinutes()}` : `${date.getHours()}:${date.getMinutes()}`,
					}
				})
					.then(response => {
						if (response.data.achievement === true) {
							const achObj = achievementsData.find(ach => ach.name === "dm_bleotard");
							if (achObj) {
								atoast({
									title: achObj.title,
									message: achObj.message,
									link: achObj.link,
									type: 'success',
								});
							}
						}
					})
					.catch(error => console.error(error));
				socket?.emit('refreshDM', {
					recipient: activeRoom,
					senderLogin: user.login,
					senderUsername: user.username,
				});
				updateUser();
				setMessageContent('');
				return;
			}
			try {
				const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
				const role = roomInfo.data.users[user.login];
				if (roomInfo.data.users[user.login] === "muted") {
					socket?.emit('messageOwn', {
						content: "You are muted in this room and thus cannot send messages",
						roomName: activeRoom,
					});
				}
				else if (role){
					const date = new Date();

					socket?.emit('newMessage', {
						senderLogin: user.login,
						senderUsername: user.username,
						role: role,
						content: messageContent,
						room: activeRoom,
						date: date.toLocaleString('fr'),
						time: date.getMinutes() < 10 ? `${date.getHours()}:0${date.getMinutes()}` : `${date.getHours()}:${date.getMinutes()}`,
					});
				}
			} catch (error) {
				console.error(error);
			}
		}
		setMessageContent('');
	};

	const parseAdminCommand = async () => {
		const command = messageContent.split(' ', 3);
		try {
			const rights = await checkRights(command[0].slice(1), command[1]);
			if (rights === "NOK")
				return;
		} catch (error) {
			console.error(error);
		}
		switch (command[0]) {
			case "/commands":
				displayCommands();
				break;
			case "/promote":
				promoteUser(command[1]);
				break;
			case "/demote":
				demoteUser(command[1]);
				break;
			case "/kick":
				kick(command[1], true);
				break;
			case "/ban":
				ban(command[1]);
				break;
			case "/unban":
				unban(command[1]);
				break;
			case "/mute":
				mute(command[1], parseInt(command[2]));
				break;
			case "/unmute":
				unmute(command[1], true);
				break;
			case "/invite":
				invite(command[1]);
				break;
			default:
				socket?.emit('messageOwn', {
					content: `${command[0]} is not a valid command.`,
					roomName: activeRoom,
				});
		}
	}

	const invite = async (invitedUsername: string) => {
		if (!invitedUsername) {
			socket?.emit('messageOwn', {
				content: 'You must provide the name of the user to invite',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${invitedUsername}`);
			const invited: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
			if (roomInfo.data.users[invited.login]) {
				socket?.emit('messageOwn', {
					content: `${invitedUsername} is already in the room.`,
					roomName: activeRoom,
				});
			}
			else {
				socket?.emit('sendInvite', {
					type: 'privateRoom',
					room: activeRoom,
					target: invitedUsername,
				});
			}
		} catch (error) {
			console.error(error);
		}
	}

	const mute = async (mutedUsername: string, time: number) => {
		if (!mutedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to mute',
				roomName: activeRoom,
			});
			return;
		}
		if (!time) {
			socket?.emit('messageOwn', {
				content: 'You need to give a time limit in in seconds',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${mutedUsername}`);
			const muted: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			const targetRole = roomInfo.data.users[muted.login];
			if (!targetRole) {
				socket?.emit('messageOwn', {
					content: `${mutedUsername} is not in ${activeRoom}`,
					roomName: activeRoom,
				});
				return;
			}
			if (targetRole === "muted") {
				socket?.emit('messageOwn', {
					content: `${mutedUsername} is already muted in ${activeRoom}`,
					roomName: activeRoom,
				});
				return;
			}
			if (targetRole === "owner") {
				socket?.emit('messageOwn', {
					content: `You can't mute the owner of ${activeRoom}!`,
					roomName: activeRoom,
				});
				return;
			}
			axios.patch('/api/rooms/setUser', {
				login: muted.login,
				status: "muted",
				roomName: activeRoom,
			})
				.then(() => {
					setTimeout(() => unmute(mutedUsername, false), time * 1000);
				})
				.catch(error => console.error(error));
			socket?.emit('messageOne', {
				content: `You were muted in ${activeRoom} for ${time} seconds`,
				roomName: activeRoom,
				recipient: muted.username,
			});
			socket?.emit('chatUpdate');
		} catch (error) {
			console.error(error);
		}
	}

	const unmute = async (unmutedUsername: string, manual: boolean) => {
		if (!unmutedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to unmute',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${unmutedUsername}`);
			const unmuted: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			if (roomInfo.data.users[unmuted.login] !== "muted" && manual) {
				socket?.emit('messageOwn', {
					content: `${unmutedUsername} is not muted in ${activeRoom}`,
					roomName: activeRoom,
				});
				return;
			}
			if (!roomInfo.data.users[unmuted.login]) {
				socket?.emit('messageOwn', {
					content: `${unmutedUsername} is not in ${activeRoom}`,
					roomName: activeRoom,
				});
				return;
			}
			axios.patch('/api/rooms/setUser', {
				login: unmuted.login,
				status: "normal",
				roomName: activeRoom,
			}).catch(error => console.error(error));
			socket?.emit('messageOne', {
				content: `You are no longer muted in ${activeRoom}`,
				roomName: activeRoom,
				recipient: unmuted.username,
			});
			socket?.emit('chatUpdate');
		} catch (error) {
			console.error(error);
		}
	}

	const ban = async (bannedUsername: string) => {
		if (!bannedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to ban',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${bannedUsername}`);
			const banned: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			const targetRole = roomInfo.data.users[banned.login];
			if (roomInfo.data.banlist.includes(banned.login)) {
				socket?.emit('messageOwn', {
					content: `${bannedUsername} is already banned from ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else if (roomInfo.data.users[banned.login] === "owner") {
				socket?.emit('messageOwn', {
					content: `You can't ban the owner of ${activeRoom}!`,
					roomName: activeRoom,
				});
				return;
			}
			else {
				if (targetRole)
					kick(bannedUsername, false);
				axios.patch('/api/rooms/ban', {
					roomName: activeRoom,
					login: banned.login,
				}).catch(error => console.error(error));
				socket?.emit('announce', {
					roomName: activeRoom,
					content: `${bannedUsername} was banned from the room`,
				});
			}
			socket?.emit('chatUpdate');
		} catch (error) {
			console.error(error)
		}
	}

	const unban = async (unbannedUsername: string) => {
		if (!unbannedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to unban',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${unbannedUsername}`);
			const unbanned: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			if (!roomInfo.data.banlist.includes(unbanned.login)) {
				socket?.emit('messageOwn', {
					content: `${unbannedUsername} is not banned from ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else {
				axios.patch('/api/rooms/unban', {
					roomName: activeRoom,
					login: unbanned.login,
				}).catch(error => console.error(error));
				socket?.emit('announce', {
					roomName: activeRoom,
					content: `${unbannedUsername} was unbanned from the room`,
				});
			}
			socket?.emit('chatUpdate');
		} catch (error) {
			console.error(error)
		}
	}

	const demoteUser = async (demotedUsername: string) => {
		if (!demotedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to demote',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${demotedUsername}`);
			const demoted: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			if (roomInfo.data.users[demoted.login] !== "admin") {
				socket?.emit('messageOwn', {
					content: `${demotedUsername} is not an admin of ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else if (!roomInfo.data.users[demoted.login]) {
				socket?.emit('messageOwn', {
					content: `${demotedUsername} is not in ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else {
				axios.patch('/api/rooms/setUser', {
					login: demoted.login,
					status: "normal",
					roomName: activeRoom,
				}).catch(error => console.error(error));
				socket?.emit('messageOne', {
					content: `Your admin rights were revoked in ${activeRoom}.`,
					roomName: activeRoom,
					recipient: demoted.username,
				});
				socket?.emit('chatUpdate');
			}
		} catch (error) {
			console.error(error);
		}
	}

	const promoteUser = async (promotedUsername: string) => {
		if (!promotedUsername) {
			socket?.emit('messageOwn', {
				content: 'You need to specify a user to demote',
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${promotedUsername}`);
			const promoted: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`)
			if (roomInfo.data.users[promoted.login] === "admin") {
				socket?.emit('messageOwn', {
					content: `${promotedUsername} is already admin of ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else if (!roomInfo.data.users[promoted.login]) {
				socket?.emit('messageOwn', {
					content: `${promotedUsername} is not in ${activeRoom}`,
					roomName: activeRoom,
				});
			}
			else {
				axios.patch('/api/rooms/setUser', {
					login: promoted.login,
					status: "admin",
					roomName: activeRoom,
				}).catch(error => console.error(error));
				socket?.emit('messageOne', {
					content: `You were promoted as admin of ${activeRoom}! Type /commands to see a list of commands.`,
					roomName: activeRoom,
					recipient: promoted.username,
				});
				socket?.emit('chatUpdate');
			}
		} catch (error) {
			console.error(error);
		}
	}

	const displayCommands = async () => {
		socket?.emit('messageOwn', {
			content: "List of available commands:",
			roomName: activeRoom,
		});
		socket?.emit('messageOwn', {
			content: "/kick <user>",
			roomName: activeRoom,
		});
		socket?.emit('messageOwn', {
			content: "/ban <user>",
			roomName: activeRoom,
		});
		socket?.emit('messageOwn', {
			content: "/unban <user>",
			roomName: activeRoom,
		});
		socket?.emit('messageOwn', {
			content: "/mute <user> <time>",
			roomName: activeRoom,
		});
		socket?.emit('messageOwn', {
			content: "/unmute <user>",
			roomName: activeRoom,
		});
		try {
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
			if (roomInfo.data.users[user.login] === "owner") {
				socket?.emit('messageOwn', {
					content: "/invite <user>",
					roomName: activeRoom,
				});
				socket?.emit('messageOwn', {
					content: "/promote <user>",
					roomName: activeRoom,
				});
				socket?.emit('messageOwn', {
					content: "/demote <user>",
					roomName: activeRoom,
				});
			}
		} catch (error) {
			console.error(error);
		}
	}

	const checkRights = async (command: string, target: string) => {
		try {
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
			const userStatus = roomInfo.data.users[user.login];
			if (command === "kick" || command === "ban" || command === "mute" || command === "unmute" || command === "unban" || command === "commands") {
				if (userStatus !== "admin" && userStatus !== "owner") {
					socket?.emit('messageOwn', {
						content: `You're not an admin of ${activeRoom}!`,
						roomName: activeRoom,
					});
					return "NOK";
				}
				if (target === user.username) {
					socket?.emit('messageOwn', {
						content: `You can't ${command} yourself!`,
						roomName: activeRoom,
					});
					return "NOK";
				}
				return "OK";
			}
			else if (command === "invite" || command === "promote" || command === "demote") {
				if (userStatus !== "owner") {
					socket?.emit('messageOwn', {
						content: `You're not the owner of ${activeRoom}!`,
						roomName: activeRoom,
					});
					return "NOK";
				}
				if (target === user.username) {
					socket?.emit('messageOwn', {
						content: `You can't ${command} yourself!`,
						roomName: activeRoom,
					});
					return "NOK";
				}
				return "OK";
			}
			else
				return "NOK";
		} catch (error) {
			console.error(error);
		}
	}

	const kick = async (kickedUsername: string, announce: boolean) => {
		if (!kickedUsername) {
			socket?.emit('messageOwn', {
				content: `You must provide the name of a user to kick`,
				roomName: activeRoom,
			});
			return;
		}
		try {
			const response = await axios.get(`/api/users/by_username/${kickedUsername}`);
			const kickedUser: UserData = response.data;
			const roomInfo = await axios.get(`/api/rooms/${activeRoom}`);
			const targetRole = roomInfo.data.users[kickedUser.login];
			if (!targetRole) {
				socket?.emit('messageOwn', {
					content: `${kickedUsername} is not in ${activeRoom}`,
					roomName: activeRoom,
				});
				return;
			}
			if (targetRole === "owner") {
				socket?.emit('messageOwn', {
					content: `You can't kick the owner of ${activeRoom}!`,
					roomName: activeRoom,
				});
				return;
			}
			await axios.patch('/api/rooms/removeUser', {
				"roomName": activeRoom,
				"username": kickedUser.login,
			});
			socket?.emit('kickSocket', {
				"kickedUser": kickedUser.login,
				"roomName": activeRoom,
			});
		} catch (error) {
			console.error("Error kicking user", error);
		}
		if (announce === true) {
			socket?.emit('announce', {
				roomName: activeRoom,
				content: `${kickedUsername} was kicked from the room`,
			});
		}
		socket?.emit('chatUpdate');
	}

	const pressEnter = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			messageSubmit();
		}
	};

	return (
		<div className={`${className} messageInput`}>

			<div className="QLF-Message grow">
				<Paragraph displayFlex={false} neon="blue">WRITE YOUR MESSAGE</Paragraph>
				<textarea
					value={messageContent}
					onChange={(e) => setMessageContent(e.target.value)}
					onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => pressEnter(event)}
					className="message-input message-container">
				</textarea>
			</div>
			<Button onClick={messageSubmit}>SEND MESSAGE</Button>
			<AchievementPopUp />
		</div>
	)
}

export default MessageInput;