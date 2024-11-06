import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {

	try {
		const code = req.query.code as string;

		if (!code) {
			console.error("Code not provided");
			res.status(400).json({ error: 'Code not provided' });
			return;
		}
		res.redirect('/api/auth/code?code=' + code);

	} catch (error) {
		console.error(error);
	}
}
