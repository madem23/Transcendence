import React, { useState } from 'react';
import axios from 'axios';
import { useUserContext } from '@/contexts/UserContext';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import { useRoomContext } from '@/contexts/RoomContext';
import Paragraph from '../ui/Paragraph';
import Button from '../ui/Button';
import { toast } from '@/ui/Toast';
import { UserData } from '@/types';

interface RoomCreationProps {
	onClose: () => void;
}

const RoomCreation: React.FC<RoomCreationProps> = ({ onClose }) => {
	const [roomName, setRoomName] = useState('');
	const [password, setPassword] = useState('');
	const [roomType, setRoomType] = useState('public');
	const socket = useWebsocketContext();
	const { user } = useUserContext();
	const { activeRoom, changeRoom } = useRoomContext();
	const [showPasswordInput, setShowPasswordInput] = useState(false);


	const handleCreateRoom = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		let invalidName: boolean = false;

		try {
			const requestBody: { name: string; type: string; password?: string } = {
				name: roomName,
				type: roomType,
			};

			if (roomType === 'protected') {
				if (!password?.trim()) {
					toast({
						title: 'Error',
						message: 'Password is required for a protected room.',
						type: 'error',
					});
					return;
				}
				requestBody.password = password;
			}
			const users = await axios.get<UserData[]>(`/api/users`);
			users.data.map(user => {
				if (user.username === roomName) {
					toast({
						title: 'Error',
						message: 'A user with that name exists.',
						type: 'error',
					});
					invalidName = true;
					return;
				}
			});
			if (invalidName)
				return;

			await axios.post(`/api/rooms/create`, requestBody);

			try {
				await axios.patch(`/api/rooms/setUser`, {
					roomName: roomName,
					login: user.login,
					status: 'owner',
				});
			} catch (error) {
				console.error("Error joining room as owner", error);
			}
			socket?.emit('joinRoom', roomName);
			socket?.emit('chatUpdate');
			if (activeRoom === "")
				changeRoom(roomName);
			onClose();
		} catch (error: any) {
			toast({
				title: 'Error',
				message: error.response.data.message,
				type: 'error',
			});
		}
		setPassword('');
		setRoomName('');
	};

	const setPublic = () => {
		setRoomType('public');
		setShowPasswordInput(false);
	}

	const setPrivate = () => {
		setRoomType('private');
		setShowPasswordInput(false);
	}

	const setProtected = () => {
		setRoomType('protected');
		setShowPasswordInput(true);
	}

	return (
		<div className='flex gap-5 flex-col justify-center align-center items-center'>
			<div className='flex gap-2 flex-col justify-center align-center items-center'>
				<Paragraph>Welcome To the create Room Modal</Paragraph>
				<Paragraph>Please Choose the type of the room you wanna create</Paragraph>

			</div>
			<p className='flex text-center justify-center font-press-start-2p text-[16px] text-white text-shadow-blue'>Room Type : {roomType}</p>
			<div className='flex flex grow items-center text-center justify-center gap-10'>
				<img
					onClick={setPublic}
					className={`cursor-pointer h-[40px] w-[40px] ${roomType === 'public' ? 'filter1' : ''}`}
					src="Public.svg"
					alt="Public Salon"
				/>
				<img
					onClick={setPrivate}
					className={`cursor-pointer h-[40px] w-[40px] ${roomType === 'private' ? 'filter1' : ''}`}
					src="Private.svg"
					alt="Private Salon"
				/>
				<img
					onClick={setProtected}
					className={`cursor-pointer h-[40px] w-[40px] ${roomType === 'protected' ? 'filter1' : ''}`}
					src="Protected.svg"
					alt="Protected Salon"
				/>
			</div>
			<div className="flex flex-col gap-5 items-center justify-center text-center">
				<Paragraph> Please Enter a RoomName:</Paragraph>
				<input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} placeholder="RoomName" name="RoomName" className="font-press-start-2p px-4 py-1 w-[80%] rounded" />
			</div>

			{showPasswordInput && (

				<div className="flex flex-col gap-5 items-center justify-center text-center">
					<Paragraph>Protected type is set, please enter a password:</Paragraph>
					<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" name="Password" className="font-press-start-2p px-4 py-1 w-[50%] rounded" />
				</div>
			)}
			<Button className='w-[50%] justify-center items-center align-center' onClick={handleCreateRoom}>Create</Button>
		</div>
	);
};

export default RoomCreation;