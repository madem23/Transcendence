import React from 'react';
import { useEffect, useRef } from 'react';
import StarField from '@/components/starsComponent';

interface Props {
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

const DefaultTheme: React.FC<Props> = ({ gameState }) => {
	const audioRef = useRef<HTMLAudioElement>(null);
	useEffect(() => {
		if (gameState?.getBall === 'left' || gameState?.getBall === 'right') {
			const audio = audioRef.current;

			if (audio && audio.paused) {
				const playPromise = audio.play();

				if (playPromise !== undefined) {
					playPromise.catch(error => {
						return;
					});
				}
			}
		}
	}, [gameState?.getBall]);



	return (
		<div className="gameBoard">
			
			{gameState.player.map((player, index) => (
				<div
					key={index}
					className={`paddle ${index === 0 ? 'left' : 'right'}`}
					style={{ top: `calc(${player.paddlePosition * 100}% - 12.5%)` }}
				/>
			))}
			<div
				className="ball"
				style={{
					left: `${gameState.ball.position.x * 100}%`,
					top: `${gameState.ball.position.y * 100}%`,
					filter: gameState?.getBall === 'left'
						? "drop-shadow(0px 0px 10px #F0F)"
						: "drop-shadow(0px 0px 10px #0FF)"
				}}
			></div>
			<audio ref={audioRef} src="collision.mp3" />


		</div>
	);
};

export default DefaultTheme;
