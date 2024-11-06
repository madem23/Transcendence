import { FC, useEffect, useState } from 'react'
import Paragraph from '../ui/Paragraph';
import { useUserContext } from '@/contexts/UserContext';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import React from 'react';
import { PlayerData, UserData, dataDate } from '@/types';


interface MatchHistoryProps {
	user: UserData;
	className?: string;
}

const MatchHistory: FC<MatchHistoryProps> = ({ className, user }) => {
	const [matchHistoryData, setMatchHistoryData] = useState<dataDate[] | null>(null);
	const player: PlayerData = {
		id: user.id,
		username: user.username,
		level: user.level,
		wins: user.wins,
		losses: user.losses,
		avatar: user.avatar,
		status: user.status,
		isBlocked: false,
		isFriend: false,
		rank: null,
	}

	async function fetchMatchHistory() {
		try {
			const response = await fetch(`/api/users/match_history/${user.id}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});

			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data: dataDate[] = await response.json();
			return (data);

		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	useEffect(() => {
		async function fetchData() {
			let fetchedMatchHistory;
			if (user.id >= 0)
				fetchedMatchHistory = await fetchMatchHistory();
			if (fetchedMatchHistory) {
				setMatchHistoryData(fetchedMatchHistory);
			}
		}
		fetchData();
	}, [user]);

	return (
		<div className={`matchhistory-layout ${className}`}>
			<Paragraph neon="blue">MATCH HISTORY</Paragraph>
			<div className="list-container-date overflow-y-auto">
				<table className='w-full border-spacing-x-[4px] border-spacing-y-[6px] border-separate overflow-hidden table-fixed'>
					<thead>
						<tr>
							<td className='w-[30%]' />
							<td className='w-[10%]' />
							<td className='w-[20%]' />
							<td className='w-[10%]' />
							<td className='w-[30%]' />
						</tr>
					</thead>
					<tbody>
						{matchHistoryData?.map((dateItem, index) => (
							<React.Fragment key={index}>

								<tr>
									<td colSpan={5}>
										<div className='date-item font-press-start-2p text-[10px] text-center text-white w-full'>{dateItem.date}</div>
									</td>
								</tr>

								{dateItem.arrayDataMatch.map((match, mIndex) => (
									<tr key={mIndex}>
										<td className='profil-info font-press-start-2p text-[10px] text-center text-white'>
											<div className='flex items-center gap-2'>
												<ProfilePicStatus player={player}
												/>
												<span className='text-ellipsis overflow-hidden whitespace-nowrap'>{user.username}</span>

											</div>
										</td>
										<td className='profil-info font-press-start-2p text-[10px] text-center text-white'>
											{match.my_score}
										</td>
										<td className={`profil-info font-press-start-2p text-[10px] text-center ${match.result === "WIN" ? "text-[#FF00FF]" : "text-[#00FFFF]"}`}>
											{match.result}
										</td>
										<td className='profil-info font-press-start-2p text-[10px] text-center text-white'>
											{match.opp_score}
										</td>
										<td className='profil-info font-press-start-2p text-[10px] text-center text-white'>
											<div className='flex items-center gap-2 justify-between'>
												<span className='text-ellipsis overflow-hidden whitespace-nowrap'>{match.opp_user}</span>
												<ProfilePicStatus player={{ ...player, avatar: match.opp_url, status: match.opp_status, }}
												/>
											</div>
										</td>

									</tr>

								))}
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

export default MatchHistory