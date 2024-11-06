import { User } from '../database/entities/user.entity';
import { Request } from 'express';

export type log = {
	time: string;
	message: string;
	type: string;
}

export type CreateUserParams = {
	login: string,
	password: string;
}

export type IntraUserParams = {
	login: string;
	avatarUrl: string;
}

export type UpdateUserProfileParams = {
	username?: string;
	avatarData?: Buffer;
	avatarUrl?: string;
}

export type CreateRoomParams = {
	name: string,
	password: string,
	type: string,
}

interface RequestWithUser extends Request {
	user: User;
}

export type Message = {
	senderLogin: string,
	senderUsername: string,
	role: string,
	content: string,
	date: string,
	time: string,
	room: string,
};

export type GameEventBody = {
	winnerScore: number;
	loserScore: number;
	winnerUsername: string;
	loserUsername: string;
	isFinish: Boolean;

};

export interface dataDate {
	date: string;
	arrayDataMatch: dataMatch[];
}

export interface dataMatch {
	opp_user: string;
	my_score: number;
	opp_score: number;
	opp_url: string;
	result: string;
	opp_status: string;
	actDate: Date;
}

export type UsernameChangeType = {
	oldName: string;
	newName: string;
};
export default RequestWithUser;