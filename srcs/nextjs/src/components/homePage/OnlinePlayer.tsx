import Paragraph from '@/ui/Paragraph';
import ButtonDot from '../ui/ButtonDot';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import { PlayerData, UserData } from '@/types';
import { useEffect, useState } from 'react';


type OnlinePlayerProps = {
	className?: string;
	user: UserData;
};

const OnlinePlayer: React.FC<OnlinePlayerProps> = ({ className, user }) => {

	const [onlinePlayersData, setOnlinePlayersData] = useState<PlayerData[]>([]);

	async function fetchOnlinePlayers() {
		try {
			const response = await fetch(`/api/users/online`, {
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
			const playersData: PlayerData[] = data.map((user: PlayerData) => {
				return {
					id: user.id,
					username: user.username,
					level: user.level,
					wins: user.wins,
					losses: user.losses,
					avatar: user.avatar ? user.avatar : "/avatar.svg",
					status: user.status,
					isBlocked: user.isBlocked,
					isFriend: user.isFriend,
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
		async function fetchData() {
			const fetchedPlayersOnline = await fetchOnlinePlayers();
			if (fetchedPlayersOnline) {
				setOnlinePlayersData(fetchedPlayersOnline);
			}
		}
		fetchData();
	}, [user]);

	const totalSlots = Math.max(5, onlinePlayersData.length);
	const slots = Array(totalSlots).fill(null).map((_, i) => onlinePlayersData[i] || null);

	return (
		<div className={`HallOfFame ${className}`}>
			<Paragraph neon="magenta">ONLINE</Paragraph>
			<div className="list-container w-full overflow-y-auto pr-2">
				{slots.map((player, index) => (
					<div key={index} className="list-item w-full px-2 py-4">
						{player ? (
							<>
								<div className="list-item-left shrink-1 overflow-x-hidden">
									<ProfilePicStatus player={player} />
									<Paragraph
										displayFlex={false}
										size="small"
										title={player.username}
										style={{ color: player.isBlocked ? 'gray' : 'white' }}
										className='w-full text-ellipsis overflow-hidden whitespace-nowrap'>
										{player.username}
									</Paragraph>
								</div>
								<div className="list-item-right shrink-0">
									<Paragraph
										displayFlex={false}
										size="small"
										style={{ color: player.isBlocked ? 'gray' : 'white' }}
										className="shrink-0 px-2.5 text-gray-500">
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

export default OnlinePlayer;