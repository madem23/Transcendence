import { NextPage } from 'next'
import React from 'react';
import { useRouter } from 'next/router'
import BackgroundWithOverlayLogo from '@/components/homePage/BackgroundWithOverlayLogo';
import useAuthStatus from '../../src/hooks/useAuthStatus';
import { useUserContext } from '@/contexts/UserContext';
import Logs from '@/components/homePage/Logs';
import HallOfFame from '@/components/homePage/HallOfFame';
import OnlinePlayer from '@/components/homePage/OnlinePlayer';
import FriendsList from '@/components/homePage/FriendsList';
import { useEffect } from 'react';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';


const Home: NextPage = () => {
	const router = useRouter();
	const isLoggedIn = useAuthStatus();
	const { user, updateUser, logs, blockedChange } = useUserContext();

	useEffect(() => {
		if (isLoggedIn === false) {
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn]);

	useEffect(() => {
		updateUser();
	}, [logs, blockedChange, user.status]);

	return isLoggedIn ? (
		<div className="home-layout">
			<BackgroundWithOverlayLogo className="backgroundwithlogo" />

			<Logs logs={user?.logs?.filter(log => log.type !== 'normal')} className="log" />

			<HallOfFame className="hallofflame" user={user} />
			<OnlinePlayer className="online" user={user} />
			<FriendsList isMagenta={true} className="friend-list" user={user} isBlockList={false} />

			<AchievementPopUp />
		</div>
	) : null;
}

export default Home;