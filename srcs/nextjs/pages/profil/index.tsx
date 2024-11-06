import { NextPage } from 'next'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import useAuthStatus from '../../src/hooks/useAuthStatus';
import ProfileCard from '@/components/profilePage/ProfileCard';
import { useUserContext } from '@/contexts/UserContext';
import FriendsList from '@/components/homePage/FriendsList';
import MatchHistory from '@/components/profilePage/MatchHistory';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import AchievementFront from '@/components/profilePage/AchievementFront';
import { dataDate } from '@/types';


const Profile: NextPage = () => {
	const isLoggedIn = useAuthStatus();
	const router = useRouter();
	const { user, updateUser, logs, blockedChange } = useUserContext();
	const [matchHistoryData, setMatchHistoryData] = useState<dataDate[] | null>(null);

	useEffect(() => {
		if (isLoggedIn === false) { 
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn]);

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

			if (user.id && user.id >= 0)
				fetchedMatchHistory = await fetchMatchHistory();
			if (fetchedMatchHistory) {
				setMatchHistoryData(fetchedMatchHistory);
			}
		}
		fetchData();
	}, [logs, blockedChange]);

	return isLoggedIn ? (
		<div className="profil-layout">
			<ProfileCard className="Profil-card" />
			{user.id >= 0 ? (
				<>
					<MatchHistory user={user} className="Match-history" />
					<AchievementFront className="Achievements" playerID={user.id} />
				</>
			) : null}
			<div className="flex flex-col blocked-friend h-full gap-2">
				<FriendsList isMagenta={false} className="friend-list" user={user} isBlockList={false} />
				<FriendsList user={user} isBlockList={true} />
			</div>
			<AchievementPopUp />
		</div>
	) : null;

}
export default Profile;