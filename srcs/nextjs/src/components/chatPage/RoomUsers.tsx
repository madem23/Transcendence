import Paragraph from '@/ui/Paragraph'; // import your Paragraph component
import ButtonDot from '../ui/ButtonDot';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import { PlayerData, RoomType, RoomUser } from '@/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useRoomContext } from '@/contexts/RoomContext';
import { useUserContext } from '@/contexts/UserContext';


type RoomUsersProps = {
	className?: string;
};

const RoomUsers: React.FC<RoomUsersProps> = ({ className }) => {
	const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
	const { activeRoom, isUpdated, isPM } = useRoomContext();

	useEffect(() => {
		const getRoomUsers = async () => {
			if (isPM) {
				try {
					const partner = await axios.get(`/api/users/by_username/${activeRoom}`);
					const roomUser: RoomUser = {
						player: {
							id: partner.data.id,
							username: partner.data.username,
							wins: partner.data.wins,
							losses: partner.data.losses,
							level: partner.data.level,
							rank: null,
							avatar: partner.data.avatarUrl ? partner.data.avatarUrl : "/avatar.svg",
							status: partner.data.status,
							isBlocked: partner.data.isBlocked,
							isFriend: partner.data.isFriend,
						},
						role: "normal",
					}
					setRoomUsers([roomUser]);
				}
				catch (error) {
					console.error(error);
				}
			}
			else {
				const roomInfo = await axios.get<RoomType>(`/api/rooms/${activeRoom}`);
				if (!roomInfo.data) {
					setRoomUsers([]);
					return;
				}
				const logins: string[] = Object.keys(roomInfo.data.users);
				const roles: string[] = Object.values(roomInfo.data.users);
				const loginsString = logins.join(' ');
				try {
					const response = await fetch(`/api/users/by_login/${loginsString}`, {
						method: 'GET',
						credentials: 'include',
					});
					if (!response.ok)
						throw new Error('fetch error, users not found');

					const data: PlayerData[] = await response.json();

					const users: RoomUser[] = data.map((user: PlayerData, index: number) => {
						const player: PlayerData = {
							id: user.id,
							username: user.username,
							wins: user.wins,
							losses: user.losses,
							level: user.level,
							rank: null,
							avatar: user.avatar ? user.avatar : "/avatar.svg",
							status: user.status,
							isBlocked: user.isBlocked,
							isFriend: user.isFriend,
						};
						const role = roles[index];
						return {
							player: player,
							role: role,
						};
					});
					setRoomUsers(users);
				} catch (error: any) {
					console.error(error);
				}
			}
		}

		if (activeRoom && activeRoom.trim()!== '')
			getRoomUsers();
		else
			setRoomUsers([]);
	}, [activeRoom, isUpdated]);
	  
  
	return (
		<div className={`HallOfFame ${className}`}>
			<Paragraph neon="blue">ROOM USERS</Paragraph>

			<div className="list-container w-full overflow-y-auto pr-2">
				{roomUsers.map((user, index) => (
					<div key={index} className="list-item w-full px-2 py-4">

						<div className="list-item-left shrink-1 overflow-x-hidden">
							<ProfilePicStatus player={user.player} />
							<Paragraph displayFlex={false} size="small"
								title={user.player.username}
								style={{
									color: user.player.isBlocked
									  ? 'gray'
									  : user.role === 'owner'
									  ? '#F0F' // Change 'color1' to the desired color for owner
									  : user.role === 'admin'
									  ? '#0FF' // Change 'color2' to the desired color for admin
									  : user.role === 'muted'
									  ? '#5A5A5A' // Change 'color3' to the desired color for muted
									  : 'white' // Default color
								  }}
								className='w-full text-ellipsis overflow-hidden whitespace-nowrap'>{user.player.username}</Paragraph>
						</div>
						<div className="list-item-right shrink-0 custom-class">
							<Paragraph displayFlex={false} size="xsmall"
								style={{
									color: user.player.isBlocked
									  ? 'gray'
									  : user.role === 'owner'
									  ? '#F0F' // Change 'color1' to the desired color for owner
									  : user.role === 'admin'
									  ? '#0FF' // Change 'color2' to the desired color for admin
									  : user.role === 'muted'
									  ? '#5A5A5A' // Change 'color3' to the desired color for muted
									  : 'white' // Default color
								  }}
								className="shrink-0 px-2.5" ></Paragraph>
							<ButtonDot player={user.player} />
						</div>
					</div>
				))}
			</div>
			<div className='legend'>
				<div className='flex justify-center items-center gap-[4px]'>
					<div className='owner'></div>
					<Paragraph>OWNER</Paragraph>
				</div>
				<div className='flex justify-center items-center gap-[4px]'>
					<div className='admin'></div>
					<Paragraph>ADMIN</Paragraph>
				</div>
				<div className='flex justify-center items-center gap-[4px]'>
					<div className='muted'></div>
					<Paragraph>MUTED</Paragraph>
				</div>

			</div>
		</div>
	);
};

export default RoomUsers;
