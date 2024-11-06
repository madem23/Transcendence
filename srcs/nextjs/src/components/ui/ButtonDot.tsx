import React from 'react';
import DropdownMenu from './DropdownMenu';
import { useState } from 'react';
import { useEffect } from 'react';
import Paragraph from './Paragraph';
import { PlayerData } from '@/types';
import { toast } from '@/ui/Toast';
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import { useUserContext } from '@/contexts/UserContext';
import Button from './Button';
import { useRoomContext } from '@/contexts/RoomContext';
import ProfileCardUsers from '../profilePage/ProfileCardUsers';
import AchievementFront from '../profilePage/AchievementFront';
import MatchHistoryUser from '../profilePage/MatchHistoryUser';
import { useRouter } from 'next/router';

type ButtonDotProps = {
	onClick?: () => void;
	player: PlayerData;
};

const ButtonDot: React.FC<ButtonDotProps> = ({ onClick, player }) => {
	const socket = useWebsocketContext();
	const { user, updateUser, updateBlockedChange } = useUserContext();
	const [showDropdown, setShowDropdown] = useState<boolean>(false);
	const [isModalChallengeOpen, setModalChallengeOpen] = useState<boolean>(false);
	const [pongTheme, setPongTheme] = useState<string>('default');
	const [pongSet, setPongSet] = useState<number>(11);
	const { changeRoom } = useRoomContext();
	const [isModalProfil, setModalProfil] = useState(false);
	const [dropDownMenuX, setDropdownmenuX] = useState(0);
	const [dropDownMenuY, setDropdownmenuY] = useState(0);
	const [DMready, setDMready] = useState(false);
	const router = useRouter();
	const [lastClicked, setLastClicked] = useState<Date | null>(null);
	const [lastAddedUserId, setLastAddedUserId] = useState<number | null>(null);
	const [lastClickedDelete, setLastClickedDelete] = useState<Date | null>(null);
	const [lastAddedUserIdDelete, setLastAddedUserIdDelete] = useState<number | null>(null);
	const [lastClickedBlock, setLastClickedBlock] = useState<Date | null>(null);
	const [lastAddedUserIdBlock, setLastAddedUserIdBlock] = useState<number | null>(null);
	const [lastClickedUnBlock, setLastClickedUnBlock] = useState<Date | null>(null);
	const [lastAddedUserIdUnBlock, setLastAddedUserIdUnBlock] = useState<number | null>(null);
	const [lastClickedChallenge, setLastClickedChallenge] = useState<Date | null>(null);
	const [lastAddedUserIdChallenge, setLastAddedUserIdChallenge] = useState<number | null>(null);
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const toggleDropdown = (event: any) => {
		if (player.id == user.id) {
			toast({
				title: "Warning",
				message: "sorry you are this user this action is not very smart !",
				type: "error",
			})
			return;
		}
		setShowDropdown(!showDropdown);
		setDropdownmenuX(event.clientX);
		setDropdownmenuY(event.clientY);
		if (onClick) {
			onClick();
		}
	};

	const AddFriend = async (player: PlayerData) => {
		const now = new Date();
		if (player.id === lastAddedUserId && lastClicked && (now.getTime() - lastClicked.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClicked(now);
		setLastAddedUserId(player.id);

		if (player.username === user.username) {
			toast({
				title: "Sorry",
				message: "You cannot add yourself as friend.",
				type: "error"
			});
		}
		else if (player.status === 'ongame') {
			toast({
				title: "Sorry",
				message: `${player.username} is playing right now. Try again later !`,
				type: "error"
			});
		}
		else {
			socket?.emit('sendFriendInvite', {
				type: 'friend',
				targetId: player.id,
				targetName: player.username,
			});
			toast({
				title: "Cool !",
				message: `You have sent a friend request to ${player.username}`,
				type: "success"
			});
		}
		setShowDropdown(!showDropdown);

	}

	const DeleteFriend = async (player: PlayerData) => {
		const now = new Date();
		if (player.id === lastAddedUserIdDelete && lastClickedDelete && (now.getTime() - lastClickedDelete.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClickedDelete(now);
		setLastAddedUserIdDelete(player.id);
		try {
			const response = await fetch(`/api/users/delete-friend`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: player.id
				}),
				credentials: 'include',
			});
			const responseJson = await response.json();
			if (response.ok) {
				socket?.emit('friendDelete', {
					name: player.username,
					id: player.id,
				});
				toast({
					title: "Success",
					message: `You have successfully unfriended ${player.username}`,
					type: "success"
				});
			} else {
				toast({
					title: "Error",
					message: `Sorry, ${responseJson.message}`,
					type: "error"
				});
			}
			setShowDropdown(!showDropdown);

		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	const BlockUser = async (player: PlayerData) => {
		const now = new Date();
		if (player.id === lastAddedUserIdBlock && lastClickedBlock && (now.getTime() - lastClickedBlock.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClickedBlock(now);
		setLastAddedUserIdBlock(player.id);
		try {
			const response = await fetch(`/api/users/block-user`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: player.id
				}),
				credentials: 'include',
			});
			const responseJson = await response.json();
			if (response.ok) {
				toast({
					title: "Success",
					message: `You have blocked ${player.username}`,
					type: "success"
				});
				socket?.emit('friendDelete', {
					name: player.username,
					id: player.id,
				});
				updateBlockedChange();
			} else {
				toast({
					title: "Error",
					message: `Sorry, ${responseJson.message}`,
					type: "error"
				});
			}
			setShowDropdown(!showDropdown);

		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	const ViewProfil = () => {
		setModalProfil(true);
	}

	const handleCloseModal = () => {
		setModalChallengeOpen(false);
		setModalProfil(false);

	}

	const UnblockUser = async (player: PlayerData) => {
		const now = new Date();
		if (player.id === lastAddedUserIdUnBlock && lastClickedUnBlock && (now.getTime() - lastClickedUnBlock.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClickedUnBlock(now);
		setLastAddedUserIdUnBlock(player.id);
		try {
			const response = await fetch(`/api/users/unblock-user`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id: player.id
				}),
				credentials: 'include',
			});
			updateBlockedChange();
			const responseJson = await response.json();
			if (response.ok) {
				toast({
					title: "Success",
					message: `You have unblocked ${player.username}`,
					type: "success"
				});
			} else {
				toast({
					title: "Error",
					message: `Sorry, ${responseJson.message}`,
					type: "error"
				});
			}
			setShowDropdown(!showDropdown);

		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	const SendDm = async (player: PlayerData) => {
		setDMready(false);
		const response = await fetch(`/api/users/openDM`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ partner: player.id }),
			credentials: 'include',
		});
		if (response.ok) {
			setDMready(true);
			updateUser();
		} else {
			toast({
				title: "Error",
				message: "Failed to open DM",
				type: "error"
			});
		}
	};

	useEffect(() => {
		if (DMready === true) {
			changeRoom(player.id.toString());
			if (router.pathname !== '/chat')
				router.push('/chat');
		}
	}, [user]);

	const SendChallenge = () => {
		setModalChallengeOpen(false);

		socket?.emit('inviteGame', { playerId: player.id, pongTheme, pongSet });
	}

	const Challenge = () => {
		const now = new Date();
		if (player.id === lastAddedUserIdChallenge && lastClickedChallenge && (now.getTime() - lastClickedChallenge.getTime()) < 20000) {
			toast({
				title: "Wait",
				message: "Please wait a few seconds before sending another request to the same user.",
				type: "error"
			});
			return;
		}
		setLastClickedChallenge(now);
		setLastAddedUserIdChallenge(player.id);

		setModalChallengeOpen(true);
	}

	const setYoshiTheme = () => {
		setPongTheme('yoshi');
	}

	const setPalmiTheme = () => {
		setPongTheme('palmi');
	}

	const setTacTheme = () => {
		setPongTheme('tac');
	}

	const setDefaultTheme = () => {
		setPongTheme('default');
	}

	const setPongSet3 = () => {
		setPongSet(3);
	}

	const setPongSet5 = () => {
		setPongSet(5);
	}

	const setPongSet11 = () => {
		setPongSet(11);
	}

	const setPongSet20 = () => {
		setPongSet(20);
	}

	const CopyUsername = (player : PlayerData) => {
		try {
			const textarea = document.createElement('textarea');
			textarea.value = player.username;
			document.body.appendChild(textarea);
			textarea.select();
			const copied = document.execCommand('copy');
			
			if (copied) {
				toast({
					title: "AMAZING !",
					message: "The username is successfully copied to the clipboard",
					type: "success"
				});
			} else {
				throw new Error('Failed to copy text');
			}  
			
			document.body.removeChild(textarea);
			setShowDropdown(!showDropdown);
		} catch (err) {
			toast({
				title: "Error !",
				message: "Sorry, a problem occurred",
				type: "error"
			});
			console.error(err);
		}
	};
	

	return (

		<div className="relative"> { }

			<button onClick={toggleDropdown} className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-secondary focus:outline-none">
				<div className="flex gap-1">
					<div className="dot"></div>
					<div className="dot"></div>
					<div className="dot"></div>
				</div>
			</button>
			<DropdownMenu show={showDropdown} onClose={() => setShowDropdown(false)} style={{
				left: `${dropDownMenuX}px`,
				top: `${dropDownMenuY}px`
			}}>

				{player.isBlocked ? (
					null
				) : player.isFriend ? (
					<button onClick={() => DeleteFriend(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
						<Paragraph className="oneligne" size="xsmall">Delete Friend</Paragraph>
					</button>
				) : (
					<button onClick={() => AddFriend(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
						<Paragraph className="oneligne" size="xsmall">Add Friend</Paragraph>
					</button>
				)}
				{player.isBlocked ? (

					<button onClick={() => UnblockUser(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
						<Paragraph className="oneligne" size="xsmall">Unblock player</Paragraph>
					</button>
				) : (
					<button onClick={() => BlockUser(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
						<Paragraph className="oneligne" size="xsmall">Block player</Paragraph>
					</button>
				)}
				<button onClick={() => SendDm(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
					<Paragraph className="oneligne" size="xsmall">Send message</Paragraph>
				</button>

				<button onClick={Challenge} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
					<Paragraph className="oneligne" size="xsmall">Challenge</Paragraph>
				</button>
				<button onClick={ViewProfil} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
					<Paragraph className="oneligne" size="xsmall">View profile</Paragraph>
				</button>

				<button onClick={() => CopyUsername(player)} className="block px-4 py-2 text-white w-full hover:bg-gray-700">
					<Paragraph className="oneligne" size="xsmall">Copy username</Paragraph>
				</button>
			</DropdownMenu>
			<>
				{isModalChallengeOpen && (
					<div className='modal'>
						<div className='modal-content p-4 gap-10 relative overflow-x-auto'>
							<button
								onClick={handleCloseModal}
								style={{
									position: 'absolute',
									top: '10px',
									left: '10px',
									color: 'white',
									background: 'none',
									border: 'none',
									fontSize: '1rem',
									cursor: 'pointer',
									filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'  
								}}
								onMouseEnter={handleMouseEnter}
								onMouseLeave={handleMouseLeave}
							>
								<img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
							</button>
							<p className='font text-center'>Choose Setting</p>
							<Paragraph>Please choose the Theme and the set</Paragraph>

							<div className='flex-container'>
								<div className='flex-1 text-center p-2'>
									<p className='font1 text-center'>Theme: {pongTheme}</p>
									<div className="flex flex-row gap-10 justify-center mt-4">
										<img onClick={setYoshiTheme} className={`cursor-pointer h-[40px] w-[40px] ${pongTheme === 'yoshi' ? 'filter1' : ''}`} src="yoshi-icone.png" alt="Yoshi Theme" />
										<img onClick={setPalmiTheme} className={`cursor-pointer h-[40px] w-[40px] ${pongTheme === 'palmi' ? 'filter1' : ''}`} src="palmi-icone.png" alt="Yoshi Theme" />
										<img onClick={setTacTheme} className={`cursor-pointer h-[40px] w-[40px] ${pongTheme === 'tac' ? 'filter1' : ''}`} src="tac-icone.png" alt="Yoshi Theme" />
										<img onClick={setDefaultTheme} className={`cursor-pointer h-[40px] w-[40px] ${pongTheme === 'default' ? 'filter1' : ''}`} src="home-icone.svg" alt="Yoshi Theme" />
									</div>
 
								</div>
								<div className='my-border'></div>
								<div className='flex-1 text-center'>
									<p className='font1 text-center'>Set: {pongSet}</p>
									<div className="flex flex-row gap-10 justify-center mt-4">
										<div onClick={setPongSet3} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 3 ?  'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] ${pongSet === 3 ? 'filter2' : ''}`}>3</p></div>
										<div onClick={setPongSet5} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 5 ?  'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] text-center ${pongSet === 5 ? 'filter2' : ''}`}>5</p></div>
										<div onClick={setPongSet11} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 11 ? 'filter1' : ''}`}><p  className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 11 ? 'filter2' : ''}`}>11</p></div>
										<div onClick={setPongSet20} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 20 ? 'filter1' : ''}`}><p  className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 20 ? 'filter2' : ''}`}>20</p></div>
									</div>
								</div>
							</div>
							<Button onClick={SendChallenge}>Send Challenge</Button>
						</div>
					</div>
				)}

			</>
			{isModalProfil && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative h-[75%] pt-[30px] overflow-y-auto'>
						<button
							onClick={handleCloseModal}
							style={{
								position: 'absolute',
								top: '10px',
								left: '10px',
								color: 'white',
								background: 'none',
								border: 'none',
								fontSize: '1rem',
								cursor: 'pointer',
								filter: isHovered ? 'drop-shadow(0px 0px 10px #F0F)' : 'none'  
							}}
							onMouseEnter={handleMouseEnter}
							onMouseLeave={handleMouseLeave}
						>
							<img className="h-[20px] w-[20px] invert-[1]" src="/cross-icone.svg" alt="Close" />
						</button>
						<div className='profil-layout-user'>
							<ProfileCardUsers player={player} className="Profil-card-user" />
							<MatchHistoryUser player={player} className="Match-history-user" />
							<AchievementFront playerID={player.id} className="Achievements-user" />
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
export default ButtonDot;