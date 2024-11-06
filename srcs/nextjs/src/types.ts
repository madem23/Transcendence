export class Vector {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
};

export interface Ball {
	position: Vector;
	direction: Vector;
};

export type Message = {
	senderLogin: string,
	senderUsername: string,
	role: string,
	content: string,
	date: string,
	time: string,
	room: string,
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

export type RoomUser = {
	player: PlayerData;
	role: string;
}

export interface PlayerPic {
	photoPath: string;
	Status: string;
}

export interface FriendDB {
	username: string;
	avatar: string;
	status: string;
}

export type Friend = {
	name: string;
	photoPath: string;
	Status: string;
}

export type RoomType = {
	id: number;
	name: string;
	type: string;
	users: { [key: string]: string };
	banlist: string[];
}

/* To be used for user_info fetch for current user */
export interface UserData {
	id: number;
	login: string,
	username: string,
	avatar: string,
	status: string;
	level: number,
	wins: number,
	losses: number,
	friends: string[],
	blocked_users: string[],
	achievements: { name: string; date: Date | null }[],
	logs: Log[],
	privateMessages: { [key: string]: Message[] },
}

/* To be used for fetch returns of OTHER users from DB */
export interface PlayerData {
	id: number;
	username: string;
	avatar: string;
	status: string;
	level: number;
	wins: number;
	losses: number;
	isBlocked: boolean;
	isFriend: boolean;
	rank: number | null;
}

/* We only display type 'highlight' and above */
export interface Log {
	time: string;
	message: string;
	type: string; //'normal' | 'highlight' | 'extraHighlight';
}

export type LogProps = {
	time: string;
	message: string;
	type: 'normal' | 'highlight' | 'extraHighlight';
};

export interface FetchingUser {
	name: string;
	id: number;
}

export interface FetchingUserDeleteFriend {
	name: string;
	id: number;
	login: string;
}

export type GameEventBody = {
	winnerScore: number;
	loserScore: number;
	winnerUsername: string;
	loserUsername: string;
	isFinish: Boolean;
};

export type FriendRequestType = {
	senderUsername: string;
	senderID: number;
};

export type PrivateRoomRequestType = {
	senderUsername: string;
	roomName: string;
};

export type UsernameChangeType = {
	oldName: string;
	newName: string;
};

export type Achievements = Achievement[];

export interface CompleteAchievement extends Achievement {
	title: string;
	message: string;
	link: string;
}

export interface Achievement {
	date: string | null;
	name: string;
}