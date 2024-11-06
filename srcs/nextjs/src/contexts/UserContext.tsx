import useAuthStatus from '@/hooks/useAuthStatus';
import { Log, UserData } from '@/types';
import React, { createContext, useState, useContext, useEffect, Dispatch, SetStateAction } from 'react';


interface UserContextType {
	user: UserData;
	setUser: React.Dispatch<React.SetStateAction<UserData>>;
	updateUser: () => void;
	logs: Log[];
	setLogs: Dispatch<SetStateAction<Log[]>>;
	setIsGameModalOpen: Dispatch<SetStateAction<boolean>>;
	isGameModalOpen: boolean;
	updateBlockedChange: () => void;
	blockedChange: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const useUserContext = () => {
	const context = useContext(UserContext);
	if (!context) {
		throw new Error('useUserContext must be used within a UserContextProvider');
	}
	return context;
};

export const UserContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
	const [user, setUser] = useState<UserData>({
		id: -1,
		login: '',
		username: '',
		avatar: '',
		status: '',
		level: 0,
		wins: 0,
		losses: 0,
		friends: [],
		blocked_users: [],
		achievements: [
			{ name: 'welcome_mdemma', date: null },
			{ name: 'first_play', date: null },
			{ name: 'first_blood', date: null },
			{ name: 'first_loss', date: null },
			{ name: 'first_friend', date: null },
			{ name: 'win_vs_mmidon', date: null },
			{ name: 'hidden_cjunker', date: null },
			{ name: 'dm_bleotard', date: null },
			{ name: 'level_21', date: null },
			{ name: '100_wins', date: null },
			{ name: 'kiss_it_flemaitr', date: null },
			{ name: 'b4rb4te', date: null },

		],
		logs: [],
		privateMessages: {},
	});
	const [userUpdate, setUserUpdate] = useState(true);
	const [logs, setLogs] = useState<Log[]>([]);
	const [isGameModalOpen, setIsGameModalOpen] = useState(false);
	const [blockedChange, setBlockedChange] = useState<boolean>(false);
	const updateBlockedChange = () => {
		setBlockedChange((prevValue) => !prevValue);
	};

	const fetchUserData = async () => {
		try {

			const response = await fetch('/api/users/user_info', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
			});
			const data = await response.json();
			setUser(data);
		} catch (error) {
		}
	}

	async function postLogs() {
		if (logs) {
			if (logs.length <= 100) {
				const response = await fetch('/api/users/logs', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						logs: logs,
					}),
					credentials: 'include',
				});
			}
		}
	}

	const updateUser = async () => {
		await postLogs();
		setUserUpdate((prevValue) => !prevValue);
	};

	useEffect(() => {
		fetchUserData();
	}, [userUpdate]);

	return (
		<UserContext.Provider value={{ user, setUser, updateUser, logs, setLogs, setIsGameModalOpen, isGameModalOpen, blockedChange, updateBlockedChange }}>
			{children}
		</UserContext.Provider>
	);
};
