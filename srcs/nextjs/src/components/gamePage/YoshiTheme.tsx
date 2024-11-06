import React, { useEffect, useRef } from 'react';

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

const YoshiTheme: React.FC<Props> = ({ gameState }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
  
    if (audio) {
      const playPromise = audio.play();
  
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          return;
        });
      }
  
      return () => {
        if (audio) {
          playPromise.then(() => {
            audio.pause();
          }).catch(error => {
            return ;
          });
        }
      };
    }
  }, []);

  return (
    <div className="yoshi-board">
      {gameState.player.map((player, index) => (
        <div
          key={index}
          className={`yoshi-paddle ${index === 0 ? 'left' : 'right'}`}
          style={{ top: `calc(${player.paddlePosition * 100}% - 12.5%)` }}
        />
      ))}
      <div
        className="yoshi-ball"
        style={{
          left: `${gameState.ball.position.x * 100}%`,
          top: `${gameState.ball.position.y * 100}%`,
        }}
      ></div>
      <div className="yoshi-anim"></div>
      <audio ref={audioRef} src="yoshitheme.mp3" loop />
    </div>
  );
};

export default YoshiTheme;
