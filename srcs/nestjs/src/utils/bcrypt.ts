import * as bcrypt from 'bcrypt';

export function encodePassword(rawPassword: string) {
	const SALT = bcrypt.genSaltSync();
	if (rawPassword)
		return bcrypt.hashSync(rawPassword, SALT);
	else
		return "";
}

export function comparePasswords(rawPassword: string, hash: string) {
	return bcrypt.compareSync(rawPassword, hash);
}