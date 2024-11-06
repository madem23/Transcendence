import React from 'react';
import classNames from 'classnames';
import { PlayerData } from '@/types';


interface ProfilePicStatusProps {
	player: PlayerData;
}

const ProfilePicStatus: React.FC<ProfilePicStatusProps> = ({ player }) => {

	return (
		<div className="profileContainer">
			<div
				className={`profilePic ${player.isBlocked ? 'blocked' : ''}`}
				style={{
					backgroundImage: `url(${player.avatar})`,
					backgroundColor: 'lightgray'
				}}
			>
				<div className={classNames('statusIndicator', {
					'backgroundOffline': player.status === 'offline',
					'backgroundOnline': player.status === 'online',
					'backgroundinGame': player.status === 'ongame'
				})}></div>
			</div>
		</div>
	);
};

export default ProfilePicStatus;