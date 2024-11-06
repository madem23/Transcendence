import React from 'react';
import Paragraph from '../ui/Paragraph';
import { FC } from 'react';
import { PlayerData } from '@/types';
import classNames from 'classnames';
import { toast } from '@/ui/Toast';
import { useState } from 'react';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import { useUserContext } from '@/contexts/UserContext';

interface ProfileCardUsersProps {
	className?: string;
	player: PlayerData;

}



const ProfileCardUsers: FC<ProfileCardUsersProps> = ({ className, player }) => {
	const [lastClicked, setLastClicked] = useState<Date | null>(null);
	const [lastAddedUserId, setLastAddedUserId] = useState<number | null>(null);
	const socket = useWebsocketContext();
	const { user } = useUserContext();



	const AddFriend = async (player: PlayerData) => {
		const now = new Date();
		if (player.id === lastAddedUserId && lastClicked && (now.getTime() - lastClicked.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClicked(now);
		setLastAddedUserId(player.id);

		if (player.username === user.username) {
			toast({
				title: "Sorry",
				message: "You cannot add yourself as friend.",
				type: "error"
			});
		}
		else if (player.status === 'ongame') {
			toast({
				title: "Sorry",
				message: `${player.username} is playing right now. Try again later !`,
				type: "error"
			});
		}
		else {
			socket?.emit('sendFriendInvite', {
				type: 'friend',
				targetId: player.id,
				targetName: player.username,
			});
			toast({
				title: "Cool !",
				message: `You have sent a friend request to ${player.username}`,
				type: "success"
			});
		}

	}

	return (
		<div className={`card-layout ${className}`}>
			<div className='flex justify-between pb-1'>
				<Paragraph neon="blue">
					{player.username} PROFILE
				</Paragraph>
			</div>
			<div className="card-container1 mb-2">
				<div className="profile-wrapper rounded-full">
					<img src={player.avatar} alt="Profile Pic" className="profile-image" />
				</div>
				<div className="player-info">
					<div className="username">
						<Paragraph displayFlex={false} neon="magenta">USERNAME</Paragraph>
						<div className="flex items-center gap-1">
							<Paragraph displayFlex={false}>{player.username}</Paragraph>
							{player.isBlocked === false && <img onClick={() => AddFriend(player)} src="add-friend.svg" alt="How to Play Logo" className="theme-logo cursor-pointer" />}

						</div>
					</div>


					<div className="status">
						<Paragraph displayFlex={false} neon="magenta">STATUS</Paragraph>
						<div className={classNames('status-indicator', {
							'backgroundOffline': player.status === 'offline',
							'backgroundOnline': player.status === 'online',
							'backgroundinGame': player.status === 'ongame'
						})}></div>
					</div>

				</div>
			</div>
			<div className="card-container2">
				<div className='flex justify-between w-full'>
					<Paragraph displayFlex={false} >LVL.{(player.level + 1).toFixed(2)} / {player.level < 5 ? 'SILVER' : player.level < 10 ? 'GOLD' : 'PLATINIUM'}</Paragraph>
					<div className='flex'>
						<Paragraph neon="magenta" displayFlex={false} >WIN RATE:
							{(player.wins + player.losses) > 0 ? (player.wins * 100 / (player.wins + player.losses)).toFixed(2) : 0}%</Paragraph>
					</div>
				</div>
				<progress className="w-full" max="100" value={(user.level % 1) * 100} />
				<div className="flex w-full">
					<div className='flex flex-col justify-center items-center grow'>
						<p className='font-press-start-2p text-[36px] text-white'>{player.wins + player.losses}</p>
						<p className='font-press-start-2p text-[12px] text-white'>PLAYED</p>
					</div>
					<div className="w-[1px] my-3 bg-white" />
					<div className='flex flex-col justify-center items-center grow'>
						<p className='font-press-start-2p text-[36px] text-white'>{player.wins}</p>
						<p className='font-press-start-2p text-[12px] text-white'>WINS</p>
					</div>
					<div className="w-[1px] my-3 bg-white" />
					<div className='flex flex-col justify-center items-center grow'>
						<p className='font-press-start-2p text-[36px] text-white'>{player.losses}</p>
						<p className='font-press-start-2p text-[12px] text-white'>LOSSES</p>
					</div>
				</div>
			</div>
		</div>
	)
}

export default ProfileCardUsers;