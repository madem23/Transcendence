import { FC } from 'react'
import Paragraph from '../ui/Paragraph';
import { useEffect, useState } from 'react';
import { achievementsData } from '@/components/achievements';
import { Achievement, Achievements, CompleteAchievement, PlayerData } from '@/types';
import { useUserContext } from '@/contexts/UserContext';


interface AchievementFrontProps {
	className?: string;
	playerID?: number;
}

function formatDateToDDMMYYYY(input: string): string {
	const [year, month, day] = input.split('-');
	return `${day}-${month}-${year}`;
}

function formatAchievementDates(achievements: Achievements): Achievements {
	return achievements.map(achievement => {
		if (achievement.date !== null) {
			const formattedDate = formatDateToDDMMYYYY(achievement.date.split('T')[0]);
			return { ...achievement, date: formattedDate };
		}
		return achievement;
	});
}

const AchievementFront: FC<AchievementFrontProps> = ({ className, playerID }) => {
	const { user } = useUserContext();
	const [achievement, setAchievement] = useState<Achievements | null>(null);
	const [completeAchievements, setCompleteAchievements] = useState<CompleteAchievement[] | null>(null);

	useEffect(() => {
		async function fetchData() {
			const fetchedAchievement = await fetchAchievement();

			if (fetchedAchievement) {
				const formattedAchievements = formatAchievementDates(fetchedAchievement);

				setAchievement(formattedAchievements);
				const mergedAchievements = formattedAchievements.map((fetchedItem: Achievement) => {
					const localData = achievementsData.find((localItem) => localItem.name === fetchedItem.name);
					return {
						...fetchedItem,
						...localData,
					} as CompleteAchievement;
				});
				setCompleteAchievements(mergedAchievements);
			}
		}
		fetchData();
	}, []);

	async function fetchAchievement() {
		try {
			const userId = playerID ? playerID : user.id;

			const response = await fetch(`/api/users/achievement-profile-page/${userId}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data = await response.json();
			return (data);

		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	return (<div className={`HallOfFame ${className}`}>
		<Paragraph displayFlex={false} neon="blue">ACHIEVEMENTS</Paragraph>
		<div className='list-container w-full pr-4 overflow-y-auto	'>
			{completeAchievements ? completeAchievements.map((ach, index) => (

				<div key={index} className={`list-item-achievement justify-between w-full px-1 py-1 gap-6 ${ach.date ? 'text-white' : 'text-[#5A5A5A]'}`}>

					<div className='flex gap-2'>
						<div className={`shrink-0 ${ach.date ? '' : 'saturate-0 brightness-50'} `} style={{
							display: 'flex',
							width: '50px',
							height: '50px',
							alignItems: 'center',
							gap: '10px',
							border: '1px solid #FFF',
							backgroundImage: `url(${ach.link})`,
							backgroundSize: 'cover',
							backgroundRepeat: 'no-repeat',
							backgroundPosition: '50% 50%',
						}}>
						</div>
						<div className="flex flex-col">
							<div className=' font-press-start-2p text-[14px]'>{ach.title}</div>
							<div className=' font-press-start-2p text-[10px]'>{ach.message}</div>
						</div>
					</div>
					<div className='flex border-l border-white py-2 w-[110px] justify-center shrink-0 pl-2'>

						<div className='flex flex-col'>
							{ach.date ? (
								<>
									<div className='font-press-start-2p text-[12px]'>UNLOCKED</div>
									<div className='font-press-start-2p text-[9px]'>{ach.date}</div>
								</>
							) : (
								<div className='font-press-start-2p text-[12px]'>LOCKED</div>
							)}
						</div>
					</div>
				</div>
			)) : <div>Loading...</div>}
		</div>

	</div>
	)
}

export default AchievementFront