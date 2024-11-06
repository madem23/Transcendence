import { useWebsocketContext } from '@/contexts/WebsocketContext';
import { UserData } from '@/types';
import React from 'react';
import { useRouter } from 'next/router';
import Paragraph from './Paragraph';
import Button from './Button';
import { toast } from '@/ui/Toast';

type SignOutButtonProps = {
	user: UserData;
	secondButton?: Boolean
};

const SignOutButton: React.FC<SignOutButtonProps> = ({ user, secondButton }: SignOutButtonProps) => {
	const socket = useWebsocketContext();
	const router = useRouter();

	const signOut = async () => {
		const endpoint = `/api/auth/logout`;
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
			credentials: 'include',
		});

		if (!response.ok) {
			const errorText = await response.text();
			toast({
				title: "Error",
				message: "Logout error: " + errorText,
				type: "error"
			});
			throw new Error(`Failed to log out. Status code: ${response.status}`);
		}
		else {
			socket?.emit('userLogOut', {
				user: user.username,
			});
		}
	};

	const signUserOut = async () => {
		try {
			await signOut();
			router.push('/');
		}
		catch (error) {
		}
	};

	return (
		secondButton ? (
			<Button onClick={signUserOut}>Sign Out</Button>
		) : (
			<button className="block px-4 py-2 text-sm text-white hover:bg-gray-700" onClick={signUserOut}>
				<Paragraph className="oneligne">Sign Out</Paragraph>
			</button>
		)
	);
};

export default SignOutButton;