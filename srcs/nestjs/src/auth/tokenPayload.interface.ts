export interface TokenPayload {
	login: string;
	sub: number;
	is2FAuthenticated: boolean;
	exp?: number;
}