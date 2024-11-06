import Paragraph from '@/ui/Paragraph'; // import your Paragraph component
import ButtonDot from '../ui/ButtonDot';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import { PlayerData, UserData } from '@/types';
import { useEffect, useState } from 'react';

type HallOfFameProps = {
	className?: string;
	user: UserData;
};

/*WARNING: validateDOMNesting(...): <p> cannot appear as a descendant of <p>. in console since i have added the ButtonDot*/
const HallOfFame: React.FC<HallOfFameProps> = ({ user, className }) => {
	const [playersData, setPlayersData] = useState<PlayerData[]>([]);

	async function fetchPlayers() {
		try {
			const response = await fetch(`/api/users/by_wins`, {
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
			const playersData: PlayerData[] = data.map((player: PlayerData, index: number) => {
				return {
					id: player.id,
					username: player.username,
					level: player.level,
					wins: player.wins,
					losses: player.losses,
					rank: index + 1,
					avatar: player.avatar ? player.avatar : "/avatar.svg",
					status: player.status,
					isBlocked: player.isBlocked,
					isFriend: player.isFriend,
				};
			});
			return playersData;
		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	useEffect(() => {
		async function fetchPlayersData() {
			const fetchedPlayers = await fetchPlayers();
			if (fetchedPlayers) {
				setPlayersData(fetchedPlayers);
			}
		}
		fetchPlayersData();
	}, [user]);
	

	const totalSlots = Math.max(5, playersData.length);
const slots = Array(totalSlots).fill(null).map((_, i) => playersData[i] || null);

return (
    <div className={`HallOfFame ${className}`}>
        <Paragraph neon="magenta">HALL OF FAME</Paragraph>
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
                                    style={{ color: player.isBlocked ? 'gray' : 'white' }}
                                    className="shrink-0">
                                    {player.rank}
                                </Paragraph>
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

export default HallOfFame;