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

const TacTheme: React.FC<Props> = ({ gameState }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
  
    if (audio) {
      const playPromise = audio.play();
  
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          return ;
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
    <div className="tac-board">
      {gameState.player.map((player, index) => (
        <div
          key={index}
          className={`tac-paddle ${index === 0 ? 'left' : 'right'}`}
          style={{ top: `calc(${player.paddlePosition * 100}% - 12.5%)` }}
        />
      ))}
    <div
      className={`tac-ball ${gameState?.getBall === 'right' ? 'flip' : ''}`}
      style={{
        left: `${gameState.ball.position.x * 100}%`,
        top: `${gameState.ball.position.y * 100}%`,
        background: "url('/tacballLeft.png') center / cover no-repeat",
      }}
    ></div>

      <div className="tac-anim"></div>
      <audio ref={audioRef} src="TacTheme.mp3" loop />
    </div>
  );
};

export default TacTheme;
