import Paragraph from '@/ui/Paragraph';
import ButtonDot from '../ui/ButtonDot';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import { PlayerData, UserData } from '@/types';
import { useEffect, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';


type FriendsListProps = {
	isMagenta?: boolean;
	className?: string;
	user: UserData
	isBlockList: boolean;
};

const FriendsList: React.FC<FriendsListProps> = ({ className, isMagenta, user, isBlockList }) => {

	const [playersData, setPlayersData] = useState<PlayerData[]>([]);
	const { blockedChange, logs } = useUserContext();

	async function fetchFriends() {
		try {
			const response = await fetch(`/api/users/friends_list`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data: PlayerData[] = await response.json();

			const playersData = data.map((friend: PlayerData) => {
				return {
					id: friend.id,
					username: friend.username,
					level: friend.level,
					wins: friend.wins,
					losses: friend.losses,
					avatar: friend.avatar ? friend.avatar : "/avatar.svg",
					status: friend.status,
					isBlocked: false,
					isFriend: true,
					rank: null,
				};
			});
			return playersData;
		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	async function fetchBlocked() {
		try {
			const response = await fetch(`/api/users/blocked_list`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data: PlayerData[] = await response.json();
			const playersData = data.map((user: PlayerData) => {
				return {
					id: user.id,
					username: user.username,
					level: user.level,
					wins: user.wins,
					losses: user.losses,
					avatar: user.avatar ? user.avatar : "/avatar.svg",
					status: user.status,
					isBlocked: true,
					isFriend: false,
					rank: null,
				};
			});
			return playersData;

		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	useEffect(() => {
		async function fetchBlockedData() {
			const fetchedBlocked = await fetchBlocked();
			if (fetchedBlocked) {
				setPlayersData(fetchedBlocked);
			}
		}
		async function fetchFriendsData() {
			const fetchedFriends = await fetchFriends();
			if (fetchedFriends) {
				setPlayersData(fetchedFriends);
			}
		}
		if (isBlockList === false)
			fetchFriendsData();
		else
			fetchBlockedData();
	}, [user]);

	const totalSlots = Math.max(10, playersData.length);
	const slots = Array(totalSlots).fill(null).map((_, i) => playersData[i] || null);


	return (
		<div className={`HallOfFame ${className}`}>
			<Paragraph neon={isMagenta ? "magenta" : "blue"}>{isBlockList ? "BLOCKED USERS" : "MY FRIENDS"}</Paragraph>
			<div className="list-container w-full overflow-y-auto pr-2">
				{slots.map((player, index) => (
					<div key={index} className="list-item w-full px-2 py-4">
						{player ? (
							<>
								<div className="list-item-left shrink-1 overflow-x-hidden">
									<ProfilePicStatus player={player} />
									<Paragraph
										title={player.username}
										displayFlex={false}
										size="small"
										className='w-full text-ellipsis overflow-hidden whitespace-nowrap'>
										{player.username}
									</Paragraph>
								</div>
								<div className="list-item-right shrink-0">
									<Paragraph
										displayFlex={false}
										size="small"
										className="shrink-0 px-2.5">
										{`${player.wins} WIN`}
									</Paragraph>
									<ButtonDot player={player} />
								</div>
							</>
						) : (
							<div className="list-item-placeholder">
								{ }
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

export default FriendsList;