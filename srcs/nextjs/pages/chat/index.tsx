import { NextPage } from 'next'
import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router'
import useAuthStatus from '../../src/hooks/useAuthStatus';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import { useRoomContext } from '@/contexts/RoomContext';
import RoomList from '@/components/chatPage/RoomList';
import RoomUsers from '@/components/chatPage/RoomUsers';
import FriendsList from '@/components/homePage/FriendsList';
import MessageInput from '@/components/chatPage/MessageInput';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import PrivateMessages from '@/components/chatPage/PrivateMessages';
import MessageDisplay from '@/components/chatPage/MessageDisplay';
import { useUserContext } from '@/contexts/UserContext';

const Chat: NextPage = () => {
	const router = useRouter();
	const isLoggedIn = useAuthStatus();
	const socket = useWebsocketContext();
	const { toggleUpdate, activeRoom } = useRoomContext();
	const { user, updateUser, logs, blockedChange } = useUserContext();

	useEffect(() => {
		if (isLoggedIn === false) {
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn]);

	useEffect(() => {
		socket?.on('chatUpdate', () => {
			toggleUpdate();
		});
		return () => {
			socket?.removeAllListeners('chatUpdate');
		}
	}, [activeRoom, socket]);

	useEffect(() => {
		updateUser();
	}, [logs, blockedChange, user.status]);

	return (
		<>
		{isLoggedIn && <div className="chat-layout">
			<AchievementPopUp />
			<RoomList className='Room' />
			<PrivateMessages className='Private-message' />
			<MessageDisplay className='Content' />
			<MessageInput className='Write-message' />
			<RoomUsers className='Room-users' />
			<FriendsList isMagenta={false} className="Friends-list" user={user} isBlockList={false} />
		</div>}
		</>
	)
}

export default Chat;