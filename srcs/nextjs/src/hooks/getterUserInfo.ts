import { useState } from "react";
import { useEffect } from "react";

export default function getUserInfo() {
	const [userInfo, setUserInfo] = useState({
		login: null,
		username: null,
		status: null,
		level: 0,
		wins: 0,
		losses: 0,
		friends: [],
		blockedUsers: [],
		achievements: [],
	});

	useEffect(() => {
		async function fetchUserInfo() {
			try {
				const response = await fetch('/api/users/user_info', {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
				});

				const data = await response.json();
				if (response.ok) {
					setUserInfo({
						login: data.login,
						username: data.username,
						status: data.status,
						level: data.level,
						wins: data.wins,
						losses: data.losses,
						friends: data.friends,
						blockedUsers: data.blockedUsers,
						achievements: data.achievements,
					});
				} else {
					setUserInfo({
						login: null,
						username: null,
						status: null,
						level: 0,
						wins: 0,
						losses: 0,
						friends: [],
						blockedUsers: [],
						achievements: [],
					});
				}
			} catch (error) {
				console.error("Error fetching user info:", error);
			}
		}
		fetchUserInfo();
	}, []);

	return userInfo;
}