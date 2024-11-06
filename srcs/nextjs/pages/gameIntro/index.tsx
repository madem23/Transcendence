import { useRouter } from "next/router";
import useAuthStatus from "@/hooks/useAuthStatus";
import { useWebsocketContext } from "@/contexts/WebsocketContext";
import { useUserContext } from "@/contexts/UserContext";
import { useState } from "react";
import { useEffect } from "react";
import { NextPage } from "next";
import Button from "@/components/ui/Button";
import Paragraph from "@/components/ui/Paragraph";
import { PlayerData } from "@/types";
import ProfilePicStatus from "@/components/ui/ProfilPicStatut";
import AchievementPopUp from '@/components/achievementPopUp/AchievementPopUp';
import StarField from '@/components/starsComponent';

const gameIntro: NextPage = () => {
	const router = useRouter();
	const isLoggedIn = useAuthStatus();
	const { user, updateUser } = useUserContext();
	const socket = useWebsocketContext();
	const [isModalOpen, setModalOpen] = useState(false);
	const [isModalIA, setModalIA] = useState(false);
	const [isHovered, setIsHovered] = useState(false);


	const [pongTheme, setPongTheme] = useState('default');
	const [pongSet, setPongSet] = useState<number>(11);
	const [playersDataOnline, setPlayersDataOnline] = useState<PlayerData[]>([]);
	const [isBot, setisBot] = useState<Boolean>(false);
	const [levelIA, setLevelIA] = useState<String>('medium');

	async function fetchPlayersOnline() {
		try {
			const response = await fetch(`/api/users/online`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'include',
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			const data: PlayerData[] = await response.json();
			const playersData: PlayerData[] = data.map((user: PlayerData) => {
				return {
					id: user.id,
					username: user.username,
					level: user.level,
					wins: user.wins,
					losses: user.losses,
					avatar: user.avatar ? user.avatar : "/avatar.svg",
					isBlocked: user.isBlocked,
					isFriend: user.isFriend,
					status: "online",
					rank: null,
				};
			});
			return playersData;
		} catch (error) {
			console.error(`Fetch Error: ${error}`);
			return null;
		}
	}

	useEffect(() => {
		async function fetchData() {
			const fetchedPlayersOnline = await fetchPlayersOnline();
			if (fetchedPlayersOnline) {
				setPlayersDataOnline(fetchedPlayersOnline);
			}
			updateUser();
		}
		fetchData();
	}, []);

	const [isHowToPlayModalOpen, setHowToPlayModalOpen] = useState(false);
	const [isPongHistoryModalOpen, setPongHistoryModalOpen] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const openHowToPlayModal = () => {
		setHowToPlayModalOpen(true);
	};

	const closeHowToPlayModal = () => {
		setHowToPlayModalOpen(false);
	};

	const openPongHistoryModal = () => {
		setPongHistoryModalOpen(true);
	};

	const closePongHistoryModal = () => {
		setPongHistoryModalOpen(false);
	};

	useEffect(() => {
		if (isLoggedIn === false) {
			router.push('/');
		}
		updateUser();
	}, [isLoggedIn]);


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

	const setIAlvlEasy = () => {
		setLevelIA('easy');
	}

	const setIAlvlMedium = () => {
		setLevelIA('medium');
	}

	const setIAlvlHard = () => {
		setLevelIA('hard');
	}

	const handleInvitePlayer = () => {
		setModalOpen(true);
	}

	const handleMatchMaking = () => {
		socket?.emit('startMatchmaking', pongTheme);
	}

	const handleChallengeBot = () => {
		setModalIA(true);
		setisBot(true);
	}

	const handleCloseModal = () => {
		setModalOpen(false);
		setModalIA(false);
	}

	const SendChallenge = (player: PlayerData) => {
		setModalOpen(false);
		socket?.emit('inviteGame', { playerId: player.id, pongTheme, pongSet, isBot });
	}

	const SendChallengeIA = () => {
		setModalIA(false);
		socket?.emit('startIA', { isBot, pongTheme, pongSet, levelIA });
	}

	return isLoggedIn ? (
		<div className="game-intro-layout">
			<div className="game-intro p-4">
				<StarField selector=".game-intro"></StarField>
				<div onClick={openPongHistoryModal} className="history-pong gap-2">
					<img src="info.svg" alt="How to Play Logo" className="theme-logo" />
					HISTORY
				</div>
				{/* <div className="flex gap-2 justify-center items-center">
						<img
							src="info.svg"
							alt="How to Play Logo"
							className="play-logo"
							onClick={openPongHistoryModal}
						/>
						<span className="play-text" onClick={openPongHistoryModal}>
							<p>HISTORY OF THE PONG OF 1972</p>
						</span>
					</div> */}

				<div className="flex flex-col justify-center items-center h-full">
					<div className="game-intro-content justify-center items-center">

						<div className="flex-font">
							WHAT ARE YOU UP TO ?
						</div>
						<div className="flex flex-col gap-2">
							<Button onClick={handleInvitePlayer} color="blue">
								INVITE A PLAYER
							</Button>
							<Button onClick={handleMatchMaking} color="magenta">
								MATCHMAKING AUTO
							</Button>
							<Button onClick={handleChallengeBot} color="blue">
								CHALLENGE A BOT
							</Button>
						</div>
					</div>

					<div className="flex flex-row justify-center items-center  mt-20">
						<div className="flex gap-2 justify-center items-center">
							<img
								src="info.svg"
								alt="How to Play Logo"
								className="play-logo"
								onClick={openHowToPlayModal}
							/>
							<span className="play-text cursor-pointer" onClick={openHowToPlayModal}>
								<p>HOW TO PLAY ?</p>
							</span>
						</div>
					</div>
				</div>

			</div>

			{isModalOpen && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative overflow-y-auto'>
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

						<p className='font text-center'>GAME SETTING</p>
						<Paragraph className="text-center">Please choose the Theme and the set</Paragraph>

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
									<div onClick={setPongSet3} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 3 ? 'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] ${pongSet === 3 ? 'filter2' : ''}`}>3</p></div>
									<div onClick={setPongSet5} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 5 ? 'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] text-center ${pongSet === 5 ? 'filter2' : ''}`}>5</p></div>
									<div onClick={setPongSet11} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 11 ? 'filter1' : ''}`}><p className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 11 ? 'filter2' : ''}`}>11</p></div>
									<div onClick={setPongSet20} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 20 ? 'filter1' : ''}`}><p className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 20 ? 'filter2' : ''}`}>20</p></div>
								</div>
							</div>
						</div>

						<div className="list-container w-full pr-2">
							{
								playersDataOnline.filter(player => player.id !== user.id).length === 0 ? (
									<Paragraph displayFlex={false}>SORRY ALL USER ARE OFFLINE</Paragraph>
								) : (
									playersDataOnline.map((player, index) => {
										if (player.id !== user.id) {
											return (
												<div key={index} className="list-item w-full px-2 py-4">
													<div className="list-item-left shrink-1 overflow-x-hidden">
														<ProfilePicStatus player={player} />
														<Paragraph displayFlex={false} size="small" className='w-full text-ellipsis overflow-hidden whitespace-nowrap'>{player.username}</Paragraph>
													</div>

													<div className="list-item-right shrink-0">
														<Paragraph displayFlex={false} size="small" className="shrink-0 px-2.5">{`${player.wins} WIN`}</Paragraph>
														<Button onClick={() => SendChallenge(player)}>INVITE PLAYER</Button>
													</div>
												</div>
											);
										} else {
											return null;
										}
									})
								)
							}

						</div>
					</div>
				</div>
			)}


			{isModalIA && (
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
						<Paragraph className="text-center">Please choose the Theme and the set</Paragraph>

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
									<div onClick={setPongSet3} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 3 ? 'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] ${pongSet === 3 ? 'filter2' : ''}`}>3</p></div>
									<div onClick={setPongSet5} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 5 ? 'filter1' : ''}`}><p className={` flex cursor-pointer text-white font-press-start-2p text-[15px] text-center ${pongSet === 5 ? 'filter2' : ''}`}>5</p></div>
									<div onClick={setPongSet11} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 11 ? 'filter1' : ''}`}><p className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 11 ? 'filter2' : ''}`}>11</p></div>
									<div onClick={setPongSet20} className={`justify-center items-center cursor-pointer flex text-center border-set p-2 h-[40px] w-[40px] ${pongSet === 20 ? 'filter1' : ''}`}><p className={`flex cursor-pointer text-white font-press-start-2p text-[15px] text-center  ${pongSet === 20 ? 'filter2' : ''}`}>20</p></div>
								</div>
							</div>
						</div>
						<div className='flex-1 text-center p-2'>
							<p className='font1 text-center'>Choose level : {levelIA}</p>
							<div className="flex flex-row gap-10 justify-center mt-4">
								<p onClick={setIAlvlEasy} className={`cursor-pointer text-white font-press-start-2p text-[16px] ${levelIA === 'easy' ? 'filter2' : ''}`}>easy</p>
								<p onClick={setIAlvlMedium} className={`cursor-pointer text-white font-press-start-2p text-[16px] ${levelIA === 'medium' ? 'filter2' : ''}`}>medium</p>
								<p onClick={setIAlvlHard} className={`cursor-pointer text-white font-press-start-2p text-[16px] ${levelIA === 'hard' ? 'filter2' : ''}`}>hard</p>
							</div>

						</div>
						<div className='flex justify-center item-center'>
							<Button onClick={SendChallengeIA}>START GAME</Button>
						</div>
					</div>
				</div>
			)}
			{isHowToPlayModalOpen && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative text-center max-h-[90vh] overflow-y-auto'>
						<button
							onClick={closeHowToPlayModal}
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

						<p className='font'>HOW TO PLAY TO THE ULTIMATE PONG ?</p>

						<div className='text-center  overflow-y-auto'>
							<p className="flex font-press-start-2p text-[18px] justify-center text-center mb-2 text-white text-shadow-blue">
								Objective
							</p>
							<p className="flex font-press-start-2p text-[12px] justify-center text-center text-white">
								The goal of Pong is to score points by hitting a ball past your opponent's paddle.
							</p>
							<br></br>
							<p className="flex font-press-start-2p text-[18px] justify-center text-center mb-2  text-white text-shadow-blue">
								Players
							</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">
								Pong is typically played by two players, each controlling a paddle on opposite sides of the screen.
							</p>
							<br></br>
							<p className="flex font-press-start-2p text-[18px] text-center justify-center mb-2  text-white text-shadow-blue">
								Game Options
							</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">Map Selection: Players can choose from various maps or playing environments.</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">Goal: Players can set the number of points required to win the game (3, 5, 11 or 15).</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">You can choose a play mode ↓</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">Challenge a Friend: Play against a friend locally.</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">Matchmaking:  Play against an online opponent.</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">Bot: Play against a computer-controlled opponent with three difficulty levels (easy, medium, hard).</p>
							<br></br>
							<p className="flex font-press-start-2p text-[18px] text-center justify-center mb-2 text-white text-shadow-blue">
								Winning
							</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">
								The player who reaches the predetermined number of points first wins the game.
							</p>
							<br></br>
							<p className="flex font-press-start-2p text-[18px] text-center mb-2  justify-center text-white text-shadow-blue">
								Serving
							</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">
								After each point is scored, the player who was scored against serves the ball to start the next round.
							</p>
							<br></br>
							<div className="flex items-center font-press-start-2p text-[16px] text-white justify-center text-center text-shadow-blue">
								<br></br>
								<p className="mr-2">
									KEY :
								</p>
								<img src="home-ctf.svg" alt="Home icon" className="h-4 w-4 filter5" /> {/* Adaptez h-4 et w-4 à la taille souhaitée */}
							</div>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">
								press UP to go UP ↑
							</p>
							<p className="flex font-press-start-2p text-[12px] text-center justify-center text-white">
								press DOWN to go DOWN ↓
							</p>
							<br></br>
							<div className="flex flex-row items-center justify-center gap-4">
								<div className="img-container1 p-2" title="Mw==">
									<img className="lazyload" src="/arrow-up.svg" />
								</div>
								<div className="img-container1 p-2" title="100">
									<img className="lazyload" src="/arrow-down.svg" />
								</div>
								<div className="img-container1 p-2" title=".____" >
									<img className="lazyload" src="/arrow-right.svg" />
								</div>
								<div className="img-container1 p-2" title="xˆ2-12x+36=0">
									<img className="lazyload" src="/arrow-left.svg" />
								</div>

							</div>
						</div>
					</div>
				</div>

			)}
			{isPongHistoryModalOpen && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 max-h-[90vh] overflow-y-auto relative text-center'>
						<button
							onClick={closePongHistoryModal}
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
						<p className='font'>WHAT ARE THE ORIGINAL PONG FROM 1972 ?</p>

						<div className='h-full gap-10 overflow-y-auto m-auto'>
							<img src="pong-original.gif" className=' m-auto' alt="GIF" style={{ width: '25vh' }} />
							<div className='flex mt-4 flex-grow justify-center text-center items-start gap-10'>
								<div className='flex flex-col gap-5 justify-center text-center items-center'>
									<p className="flex font-press-start-2p text-[16px] text-white text-shadow-blue">
										INVENTOR
									</p>
									<p className="font-press-start-2p text-[12px] text-white">Alan Alcorn</p>
									<img src="alcorn.jpg" alt="JPG" style={{ width: '15vh', height: '15vh' }} />

								</div>
								<div className='flex flex-col gap-5 justify-center text-center items-center'>
									<p className="flex font-press-start-2p text-[16px] text-white text-shadow-blue">
										MANUFACTURED BY
									</p>
									<p className="flex font-press-start-2p text-[12px] text-white">Atari</p>
									<img src="atari.png" alt="PNG" style={{ width: '15vh', height: '15vh' }} />
								</div>
							</div>
							<p className="m-auto text-center mt-10 font-press-start-2p text-[16px] text-white text-shadow-blue">
								HISTORY
							</p>
							<p className="mt-10 flex font-press-start-2p text-[12px] text-white">
								Pong is a video game released originally as a coin-operated arcade game by Atari Inc. on November 29, 1972. Pong is based on the sport of table tennis (or "ping pong"), and named after the sound generated by the circuitry when the ball is hit.
								Pong is often regarded as the world's first video arcade game, but Computer Space by Nutting Associates had been launched a year earlier in 1971.
								Pong was the first video game to achieve widespread popularity in both arcade and home console versions, and launched the initial boom in the video game industry.
							</p>
						</div>
					</div>
					<AchievementPopUp />
				</div>
			)}
		</div>
	) : null;

}

export default gameIntro;