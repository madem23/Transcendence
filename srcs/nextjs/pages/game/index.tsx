import { NextPage } from 'next'
import React from 'react';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/router'
import useAuthStatus from '../../src/hooks/useAuthStatus';
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import { useGameContext } from '@/contexts/GameContext';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import DefaultTheme from '@/components/gamePage/DefaultTheme';
import { useRef } from 'react';
import YoshiTheme from '@/components/gamePage/YoshiTheme';
import TacTheme from '@/components/gamePage/MegaMan';
import PalmiTheme from '@/components/gamePage/PalmiTheme';
import { useUserContext } from '@/contexts/UserContext';

const GamePage: NextPage = () => {
	const { gameState } = useGameContext();
	const socket = useWebsocketContext();
	const keysPressed = useRef<{ [key: string]: boolean }>({});
	const router = useRouter();
	const isLoggedIn = useAuthStatus();
	const { updateUser } = useUserContext();


	const movePaddle = useCallback(() => {
		if (keysPressed.current.ArrowUp) {
			socket?.emit('movePaddle', { roomName: gameState?.roomName, direction: 'ArrowUp' });
		}
		if (keysPressed.current.ArrowDown) {
			socket?.emit('movePaddle', { roomName: gameState?.roomName, direction: 'ArrowDown' });
		}
		requestAnimationFrame(movePaddle);
	}, [gameState?.roomName, socket]);

	useEffect(() => {
		if (isLoggedIn === false) {
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn]);

	useEffect(() => {
		if (!gameState) {
			router.push('/home');
		}
	}, [gameState]);


	useEffect(() => {

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				keysPressed.current[e.key] = true;
			}
		};

		const handleKeyUp = (e: KeyboardEvent) => {
			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
				keysPressed.current[e.key] = false;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);

		movePaddle();

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('keyup', handleKeyUp);
			socket?.emit('leavePage', gameState?.roomName);


		};
	}, [movePaddle, gameState?.roomName]);


	interface GameBoardProps {
		gameState: {
			getBall: string;
			player: {
				paddlePosition: number;
			}[];
			ball: {
				position: {
					x: number;
					y: number;
				};
			};
		};
	}


	let GameBoardComponent: React.FC<GameBoardProps> | null = null;

	if (gameState) {
		switch (gameState.pongTheme) {
			case 'yoshi':
				GameBoardComponent = YoshiTheme;
				break;
			case 'tac':
				GameBoardComponent = TacTheme;
				break;
			case 'palmi':
				GameBoardComponent = PalmiTheme;
				break;
			default:
				GameBoardComponent = DefaultTheme;
		}
	}

	return (
		<>
			{gameState &&
				(<div className="game-layout">
					{gameState ? (
						GameBoardComponent && <GameBoardComponent gameState={gameState} />
					) : (null
					)}
					<div className="info-player">
						<div className="player-canva">
							<div className='container-canva'>
								<div
									className='img-container shrink-0'
									style={{ backgroundImage: `url(${gameState?.player[0].avatar})` }}
								>
								</div>
								<div className='info-container' >
									<p className='info-username-left'>{gameState?.player[0].username} </p>
									{gameState && gameState.player[0] ?
										<p className='info-rank'>LVL.{gameState.player[0].isBot ? (gameState.player[1].level + 1.00).toFixed(2)
											: (gameState.player[0].level + 1.00).toFixed(2)} / {gameState.player[0].isBot ? 'BOT CARBON'
												: (gameState.player[0].level < 5 ? 'SILVER' : gameState.player[0].level < 10 ? 'GOLD' : 'PLATINIUM')}</p>
										: null
									}
								</div>
							</div>
						</div>
						<div className="centered-div">
							{gameState?.player[0].score} - {gameState?.player[1].score}
						</div>
						<div className="player-canva">
							<div className='container-canva'>
								<div
									className='img-container shrink-0'
									style={{ backgroundImage: `url(${gameState?.player[1].avatar})` }}
								>
								</div>
								<div className='info-container'>
									<p className='info-username-right'>{gameState?.player[1].username} </p>
									{gameState && gameState.player[1] ?
										<p className='info-rank'>LVL.{gameState.player[1].isBot ? (gameState.player[0].level + 1.00).toFixed(2)
											: (gameState.player[1].level + 1.00).toFixed(2)} / {gameState.player[1].isBot ? 'BOT CARBON'
												: (gameState.player[1].level < 5 ? 'SILVER' : gameState.player[1].level < 10 ? 'GOLD' : 'PLATINIUM')}</p>
										: null
									}
								</div>
							</div>
						</div>
						<AchievementPopUp />
					</div>
				</div>
				)}
		</>
	);

}

export default GamePage;

