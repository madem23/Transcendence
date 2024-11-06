import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function useAuthStatus() {
	const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
	const router = useRouter();

	useEffect(() => {
		async function checkAuthStatus() {
			try {
				const response = await fetch(`/api/users/user_info`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				});

				const data = await response.json();

				if (response.ok) {
					setIsLoggedIn(true);
				} else {
					setIsLoggedIn(false);
				}

			} catch (error) {
				setIsLoggedIn(false);
				console.error("Error fetching auth status:", error);
			}
		}
		checkAuthStatus();
	}, [router.pathname]);

	return isLoggedIn;
}

export default useAuthStatus;