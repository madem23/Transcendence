import { useRoomContext } from "@/contexts/RoomContext";
import { useUserContext } from "@/contexts/UserContext";
import { useWebsocketContext } from "@/contexts/WebsocketContext";
import axios from 'axios';
import { toast } from '@/ui/Toast';
import { useState } from "react";
import Button from "../ui/Button";

interface JoinRoomButtonProps {
	room: {
		name: string,
		password: string,
		type: string,
		users: {},
		banlist: string[],
	}
}

const JoinRoomButton = ({ room }: JoinRoomButtonProps) => {
	const socket = useWebsocketContext();
	const { user } = useUserContext();
	const { activeRoom, changeRoom } = useRoomContext();
	const [isModalPassword, setModalPassword] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const [password, setPassword] = useState("");

	const setUserStatus = async (status: string) => {
		try {
			await axios.patch(`/api/rooms/setUser`, {
				"roomName": room.name,
				"login": user.login,
				"status": status,
			});
		} catch (error) {
			console.error(`Error joining room as ${status}`, error);
		}
	}

	const joinRoom = async () => {
		if (Object.keys(room.users).length > 0)
			await setUserStatus("normal");
		else
			await setUserStatus("owner");
		socket?.emit('joinRoom', room.name);
		socket?.emit('announce', {
			roomName: room.name,
			content: `${user.username} joined the room`,
		});
		socket?.emit('chatUpdate');
		if (activeRoom === "")
			changeRoom(room.name);
	}

	const checkRoomType = async () => {
		if (room.type === "private") {
			toast({
				title: "Error.",
				message: "This room is private. You need an invitation.",
				type: "error"
			})
			return;
		}
		if (room.banlist.includes(user.login)) {
			toast({
				title: "Error.",
				message: `You are banned from ${room.name}`,
				type: "error"
			})
			return;
		}
		if (room.type === "protected") {
			setModalPassword(true);
			return;
		}
		joinRoom();
	}

	const handlePasswordValidation = async () => {
		if (password.trim() === "") {
			toast({
				title: 'Error',
				message: 'Password cannot be empty.',
				type: 'error',
			});
			return;
		}
		const match = await axios.get(`api/rooms/checkPassword/${room.name}/${password}`);
		if (match.data === false) {
			toast({
				title: 'Error',
				message: 'Wrong password.',
				type: 'error',
			});
		} else {
			joinRoom();
			setModalPassword(false);
		}
	};

	return (
		<>
			<button onClick={checkRoomType}>
				<img src="/join-btn.svg" />
			</button>
			{isModalPassword && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative'>
						<button
							onClick={() => setModalPassword(false)}
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
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						>
							<img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
						</button>
						<p className='font text-center'>Enter Password</p>
						<div className='flex flex-col justify-center items-center gap-5'>
							<input
								type="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								placeholder="Password"
								name="Password"
								className="font-press-start-2p px-4 py-1 w-[50%] rounded"
							/>
							<Button onClick={handlePasswordValidation}>Submit</Button>
						</div>
					</div>
				</div>)}
		</>
	)
}

export default JoinRoomButton