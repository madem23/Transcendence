import { useRoomContext } from "@/contexts/RoomContext"
import { useState } from "react";
import axios from 'axios'
import { useWebsocketContext } from "@/contexts/WebsocketContext";
import Paragraph from "../ui/Paragraph";
import Button from "../ui/Button";
import { toast } from "../ui/Toast";

type OwnedRoomSettingsProps = {
	closeModal: () => void;
	roomType?: string;
};

const OwnedRoomSettings: React.FC<OwnedRoomSettingsProps> = ({ closeModal, roomType }) => {
	const { activeRoom, changeRoom } = useRoomContext();
	const [newRoomType, setNewRoomType] = useState<string>('');
	const [password, setPassword] = useState('');
	const [showPasswordInput, setShowPasswordInput] = useState(false);
	const socket = useWebsocketContext();

	const deleteRoom = async () => {
		if (confirm("Do you really want to delete this room?")) {
			try {
				await axios.delete(`/api/rooms/delete/${activeRoom}`);
			} catch (error) {
				console.error("Error deleting room", error);
			}
			changeRoom('');
			socket?.emit('clearRoom', activeRoom);
			socket?.emit('chatUpdate');
			closeModal();
		}
	}

	const setPublic = () => {
		if (roomType != 'public') {
			setNewRoomType('public');
			setShowPasswordInput(false);
		}
		else {
			toast({
				title: "Actual room",
				message: "I apologize, but the current type is 'Public.' Please choose between 'Private' and 'Protected'.",
				type: "error"
			});
		}
	}

	const setPrivate = () => {
		if (roomType != 'private') {
			setNewRoomType('private');
			setShowPasswordInput(false);
		}
		else {
			setNewRoomType('');
			toast({
				title: "Actual room",
				message: "Sorry, chose between public and protected",
				type: "error"
			});
		}
	}

	const setProtected = () => {
		if (roomType != 'protected') {
			setNewRoomType('protected');
			setShowPasswordInput(true);
		}
		else {
			setNewRoomType('');
			toast({
				title: "Actual room",
				message: "Sorry, chose between private and public",
				type: "error"
			});
		}

	}

	const SetToPrivate = async () => {
		if (confirm("Are you sure you want to set the room type to private? This will remove the password if the room is currently protected.")) {
			try {
				const response = await axios.patch(`/api/rooms/setPassword`, {
					"roomName": activeRoom,
					"newPassword": null,
					"type": "private",
				});
				if (response.status === 200) {
					socket?.emit('chatUpdate');
					closeModal();
					toast({
						title: "Cool!",
						message: `You successfuly changed the room type to: ${newRoomType}`,
						type: "success"
					});
				}
				else {
					toast({
						title: "Error",
						message: "Failed to set the type to private",
						type: "error"
					});
				}


			} catch (error) {
				console.error(error);
			}
			socket?.emit('chatUpdate');
		}
	}

	const setPasswordHandler = async () => {
		const newPassword = password.trim();
		const type = newPassword === '' ? 'public' : 'protected';
		
		if ((roomType === 'protected' && newPassword === '') || (newRoomType === 'protected' && newPassword === '')) {
			toast({
				title: 'Error',
				message: 'Password is required for a protected room and cannot be empty.',
				type: 'error',
			});
			return;
		}

		try {
			const response = await axios.patch(`/api/rooms/setPassword`, {
				roomName: activeRoom,
				newPassword,
				type,
			});
			if (response.status === 200) {
				socket?.emit('chatUpdate');
				closeModal();
				if (newRoomType) {
					toast({
						title: "Cool!",
						message: `You successfuly changed the room type to: ${newRoomType}`,
						type: "success"
					});
				}

			} else {
				toast({
					title: "Error",
					message: "Failed to update password",
					type: "error"
				});
			}
		} catch (error) {
			console.error(error);
		}
		socket?.emit('chatUpdate');
	};

	const handlePassword = () => {
		setShowPasswordInput(true);
	}

	return (
		<div className="text-white">
			<div className='flex gap-5 flex-col justify-center align-center items-center'>
				<div className='flex gap-1 flex-col justify-center align-center items-center'>
					<Paragraph>Here, you can adjust the room's type.</Paragraph>
					<Paragraph>Simply click on the appropriate icon</Paragraph>
					<Paragraph>in the following order:</Paragraph>
					<Paragraph>Public, Private, Protected.</Paragraph>
				</div>
				<p className='flex text-center justify-center font-press-start-2p text-[16px] text-white text-shadow-blue'>Current Type: {roomType}</p>

				<div className='flex flex grow items-center text-center justify-center gap-10'>
					<img
						onClick={setPublic}
						className={`cursor-pointer h-[40px] w-[40px] ${newRoomType === 'public' ? 'filter1' : ''}`}
						src="Public.svg"
						alt="Public Salon"
					/>
					<img
						onClick={setPrivate}
						className={`cursor-pointer h-[40px] w-[40px] ${newRoomType === 'private' ? 'filter1' : ''}`}
						src="Private.svg"
						alt="Private Salon"
					/>
					<img
						onClick={setProtected}
						className={`cursor-pointer h-[40px] w-[40px] ${newRoomType === 'protected' ? 'filter1' : ''}`}
						src="Protected.svg"
						alt="Protected Salon"
					/>
				</div>

				{roomType === 'protected' && newRoomType !== 'public' && newRoomType !== 'private' && (
					<Button className="w-[220px]" onClick={handlePassword}>CHANGE PASSWORD</Button>
				)}

				{showPasswordInput && (
					<div className="flex flex-col gap-5 items-center justify-center text-center">
						<Paragraph>please enter a password:</Paragraph>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Password"
							name="Password"
							className="font-press-start-2p px-4 py-1 w-[50%] rounded"
						/>
					</div>
				)}

				<p className='flex text-center justify-center font-press-start-2p text-[16px] text-white text-shadow-pink'>New Type: {newRoomType}</p>
				<Button className="w-[220px]" onClick={newRoomType === 'private' ? SetToPrivate : setPasswordHandler}>
					SUBMIT
				</Button>
				<hr className="h-[2px] mt-[10px] w-[80%]" />
				<div className='flex gap-2 flex-col justify-center align-center items-center mt-4'>
					<Paragraph neon="magenta">WARNING</Paragraph>
					<Paragraph>You also have the option to delete the room,</Paragraph>
					<Paragraph>in which case the messages will be permanently lost.</Paragraph>
				</div>
				<Button className="w-[220px]" onClick={deleteRoom}>DELETE ROOM</Button>
			</div>
		</div>
	);
}

export default OwnedRoomSettings