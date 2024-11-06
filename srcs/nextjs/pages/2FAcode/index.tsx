import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Paragraph from '@/components/ui/Paragraph';
import Button from '@/components/ui/Button';
import { NextPage } from 'next';
import { toast } from '@/ui/Toast';


const Home: NextPage = () => {
	const router = useRouter();
	const [code, setCode] = useState('');

	const handleSubmit = async () => {
		const codeStr = code.toString();
		try {
			const response = await fetch(`/api/2fa/authenticate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					twoFACode: codeStr,
				}),
				credentials: 'include',
			});

			let responseBody;
			if (response.headers.get("content-type")?.includes("application/json")) {
				responseBody = await response.json();
			} else {
				responseBody = await response.text();
			}

			if (response.ok && responseBody.redirect === '/home') {
				router.push("/home");
			} else {
				toast({
					title: "Error",
					message: "the code is invalid",
					type: "error"
				});
			}
		} catch (error) {
			console.error("Erreur lors de l'envoi du code:", error);
		}
	};


	return (
		<main className="flex flex-col justify-center items-center gap-5 mt-4 mb-4">
			<Paragraph>2FA Authentification</Paragraph>
			<Paragraph>Please enter your Google Authentificator code</Paragraph>
			<input
				type="text"
				value={code}
				onChange={e => setCode(e.target.value)}
				placeholder=""
				className="font-press-start-2p px-4 py-1 w-300 rounded"
			/>
			<Button onClick={handleSubmit} className="mt-2">
				Submit
			</Button>
		</main>
	);
}

export default Home;
