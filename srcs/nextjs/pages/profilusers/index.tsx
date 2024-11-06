import { NextPage } from 'next'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router'
import useAuthStatus from '../../src/hooks/useAuthStatus';
import ProfileCardUsers from '@/components/profilePage/ProfileCard';
import { useUserContext } from '@/contexts/UserContext';
import FriendsList from '@/components/homePage/FriendsList';
import MatchHistory from '@/components/profilePage/MatchHistory';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import AchievementFront from '@/components/profilePage/AchievementFront';

const Profile: NextPage = () => {
	const { user, logs, blockedChange } = useUserContext();
	const isLoggedIn = useAuthStatus();
	const router = useRouter();
	const { updateUser } = useUserContext();

	useEffect(() => {
		if (isLoggedIn === false) {
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn, logs, blockedChange]);


	return isLoggedIn ? (

		<div className="profil-layout">
			<AchievementPopUp />
			<ProfileCardUsers className="Profil-card" />
			{user.id >= 0 ? (
				<>
					<MatchHistory user={user} className="Match-history" />
					<AchievementFront className="Achievements" playerID={user.id} />
				</>
			) : null}
			<div className="flex flex-col blocked-friend h-full gap-2">
				<FriendsList isMagenta={true} className="friend-list" user={user} isBlockList={false} />
				<FriendsList user={user} isBlockList={true} />
			</div>
		</div>
	) : null;
}
export default Profile;
