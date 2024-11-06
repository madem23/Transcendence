import { FC, useEffect, useState } from 'react'
import Paragraph from '../ui/Paragraph';
import ProfilePicStatus from '../ui/ProfilPicStatut';
import React from 'react';
import { PlayerData, dataDate } from '@/types';


interface MatchHistoryUserProps {
	className?: string;
	player: PlayerData;
}

const MatchHistoryUser: FC<MatchHistoryUserProps> = ({ className, player }) => {
	const [matchHistoryData, setMatchHistoryData] = useState<dataDate[] | null>(null);

	async function fetchMatchHistory() {
		try {
			const response = await fetch(`/api/users/match_history/${player.id}`, {
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
			const fetchedMatchHistory = await fetchMatchHistory();
			if (fetchedMatchHistory) {
				setMatchHistoryData(fetchedMatchHistory);
			}
		}
		fetchData();
	}, []);

	return (
		<div className={`matchhistory-layout h-full ${className}`}>
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
												<span className='text-ellipsis overflow-hidden whitespace-nowrap'>{player.username}</span>

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

export default MatchHistoryUser