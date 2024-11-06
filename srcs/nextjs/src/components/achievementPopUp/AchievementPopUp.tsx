import React, { useEffect } from 'react';
import { achievementsData } from '@/components/achievements';
import { atoast } from '@/ui/ToastAchievement';

async function getAchievementList() {

	const response = await fetch(`/api/users/achievements`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
	});

	const body = await response.json();
	return body;
}

const AchievementPopUp = () => {
	useEffect(() => {
		async function getPopUp() {
			const match_achievements = await getAchievementList();
			if (Array.isArray(match_achievements)) {
				for (const achievementName of match_achievements) {
					const achObj = achievementsData.find(ach => ach.name === achievementName);
					if (achObj) {
						atoast({
							title: achObj.title,
							message: achObj.message,
							link: achObj.link,
							type: 'success',
						});
					}
				}
			}
		}
		getPopUp();
	}, []);

	return (
		<div>{ }</div>
	);
};

export default AchievementPopUp;