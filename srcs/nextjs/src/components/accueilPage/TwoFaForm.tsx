import { useRouter } from 'next/router';
import { FC, useState } from 'react'
import Paragraph from '../ui/Paragraph';
import Button from '../ui/Button';
import { toast } from '@/ui/Toast';


interface TwoFaFormProps {

}

const TwoFaForm: FC<TwoFaFormProps> = ({ }) => {
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
					message: responseBody,
					type: "error"
				});
			}
		} catch (error) {
			console.error('2FA code:', error);
		}
	};


	return (
		<main className="flex flex-col justify-center items-center mt-4 mb-4">
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

export default TwoFaForm