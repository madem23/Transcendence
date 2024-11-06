import { useUserContext } from "@/contexts/UserContext";
import { useWebsocketContext } from "@/contexts/WebsocketContext";
import axios from 'axios'
import { useRoomContext } from "@/contexts/RoomContext";

interface LeaveRoomButtonProps {
	roomName: string;
}

const LeaveRoomButton = ({ roomName }: LeaveRoomButtonProps) => {
	const socket = useWebsocketContext();
	const { user } = useUserContext();
	const { changeRoom } = useRoomContext();

	const findReplacementOwner = (users: any) => {
		for (const login in users) {
			if (users[login] === "admin")
				return login;
			if (users[login] === "normal")
				return login;
			if (users[login] === "muted")
				return login;
		}
		return null;
	}

	const changeOwner = async () => {
		try {
			const room = await axios.get(`/api/rooms/${roomName}`);
			if (room.data.users[user.login] === "owner") {
				const newOwner = findReplacementOwner(room.data.users);
				if (newOwner) {
					try {
						await axios.patch(`/api/rooms/setUser`, {
							"login": newOwner,
							"roomName": roomName,
							"status": "owner",
						});
					} catch (error) {
						console.error("Error naming new owner", error)
					}
				}
				else if (room.data.type === "private") { // Set to public when the owner of a private room leaves it empty
					try {
						await axios.patch(`/api/rooms/setPassword`, {
							"roomName": roomName,
							"newPassword": "",
							"type": "public",
						});
					} catch (error) {
						console.error(error);
					}
				}
			}
		} catch (error) {
			console.error("Error changing owner", error);
		}
	}

	const leaveRoom = async () => {
		await changeOwner();
		try {
			await axios.patch(`/api/rooms/removeUser`, {
				"roomName": roomName,
				"username": user.login,
			});
		} catch (error) {
			console.error("Error leaving room", error);
		}
		socket?.emit('removeSocket', {
			"roomName": roomName,
			"login": user.login,
		});
		changeRoom('');
		socket?.emit('chatUpdate');
	}

	return <button onClick={leaveRoom}>
		<img src="/leave-btn.svg" />

	</button>
}

export default LeaveRoomButton