import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWebsocketContext } from './WebsocketContext';
import { Ball } from '@/types';

interface GameState {
	roomName: string;
	ball: Ball;
	pongTheme: string;
	getBall: string;
	player: {
		paddlePosition: number,
		score: number,
		username: string,
		avatar: string,
		level: number,
		isBot: boolean
	}[];
}

interface GameContextProps {
	gameState: GameState | undefined;
	setGameState: React.Dispatch<React.SetStateAction<GameState | undefined>>;
}

export const GameContext = createContext<GameContextProps>({
	gameState: undefined,
	setGameState: () => { },
});


export const GameProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {

	const [gameState, setGameState] = useState<GameState | undefined>(undefined);
	return (
		<GameContext.Provider
			value={{ setGameState, gameState }}
		>
			{children}
		</GameContext.Provider>
	);
};

export const useGameContext = () => {
	const context = useContext(GameContext);
	if (!context) {
		throw new Error('useGameContext must be used within a GameProvider');
	}
	return context;
};