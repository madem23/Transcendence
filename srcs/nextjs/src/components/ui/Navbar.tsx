import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import DropdownMenu from './DropdownMenu';
import Paragraph from './Paragraph';
import { useUserContext } from '@/contexts/UserContext';
import useAuthStatus from '@/hooks/useAuthStatus';
import SignOutButton from './SignoutButton';
import AchievementPopUp from '../achievementPopUp/AchievementPopUp';
import { setAchievementByName } from '../achievements';
import React from 'react';

type NavbarProps = {
	className?: string;
};

const Navbar: React.FC<NavbarProps> = ({ className }) => {
	const { user } = useUserContext();
	const isLoggedIn = useAuthStatus();
	const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
	const profileMenuRef = useRef<HTMLDivElement | null>(null);
	const [dropDownMenuX, setDropdownmenuX] = useState(0);
	const [dropDownMenuY, setDropdownmenuY] = useState(0);
	const [isModalOpen, setModalOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const desiredSequence = ['up', 'up', 'up', 'down', 'down', 'down', 'down', 'right', 'left', 'left', 'left', 'left', 'left', 'left'];
	const [actions, setActions] = useState<string[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [activeDirection, setActiveDirection] = useState<string | null>(null);
	const router = useRouter();
	const [congratz, setCongratz] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	useEffect(() => {
		if (!isModalOpen) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			let direction: string = '';
			switch (event.key) {
				case 'ArrowUp':
					direction = 'up';
					break;
				case 'ArrowDown':
					direction = 'down';
					break;
				case 'ArrowLeft':
					direction = 'left';
					break;
				case 'ArrowRight':
					direction = 'right';
					break;
				default:
					return;
			}

			if (direction === desiredSequence[currentIndex]) {
				setCurrentIndex(prevIndex => {
					const newIndex = prevIndex + 1

					setActiveDirection(direction);

					if (newIndex === desiredSequence.length) {
						if (router.pathname == '/home')
							setAchievementByName('hidden_cjunker');
						setCongratz(true);
					}
					return newIndex;
				});
			}

			else {
				setCurrentIndex(0);
			}
			setActions(prevActions => [...prevActions, direction]);

		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [actions, isModalOpen]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
				setShowProfileMenu(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);


	const handleProfileMenuToggle = (event: any) => {
		setShowProfileMenu(!showProfileMenu);
		setDropdownmenuX(event.clientX);
		setDropdownmenuY(event.clientY);
	};


	const handleHomeClick = () => {
		if (router.pathname !== '/home') {
			router.push('/home');
		}
	};

	const handleThemeClick = () => {
		setModalOpen(true);
	};

	const handleCloseModal = () => {
		setModalOpen(false);
	}

	const handleChatClick = () => {
		if (router.pathname !== '/chat') {
			router.push('/chat');
		}
	}

	return (
		<div className="flex w-full h-[90px] justify-between items-center p-5 box-border top-0">
			<div className="flex items-center">
				<button onClick={handleHomeClick}>
					<img className="lazyload" src="/left-side.svg" alt="Home" />
				</button>
			</div>

			{isLoggedIn && (
				<div className="scroll-container">
					<Paragraph className="w-full scroll-text" neon="blue">
						🍦 Welcome {user.username} ! 🏓
					</Paragraph>
				</div>
			)}
			<div className="flex justify-between items-center w-[150px]">
				<div>
					<button onClick={handleThemeClick}>
						<img className="lazyload" src="/theme-icon.svg" alt="Theme" />
					</button>
				</div>
				<div>
					<button onClick={handleChatClick}>
						<img className="lazyload" src="/chat-icon.svg" alt="Chat" />
					</button>
				</div>
				<div className="relative">
					<button onClick={handleProfileMenuToggle}>
						<img className="lazyload" src="/user-icon.svg" alt="User" />
					</button>
					<DropdownMenu
						isTranslate={true}
						show={showProfileMenu}
						onClose={() => setShowProfileMenu(false)} style={{
							left: `${dropDownMenuX}px`,
							top: `${dropDownMenuY}px`
						}}>
						<button onClick={() => router.push('/profil')} className="block px-4 py-2 text-sm w-full text-white hover:bg-gray-700">
							<Paragraph>Profile</Paragraph>
						</button>
						<SignOutButton user={user} />
					</DropdownMenu>
				</div>
			</div>
			{isModalOpen && (
				<div className='modal'>
					<div className='modal-content p-4 gap-10 relative'>
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
						<p className='font text-center'>TOP SECRET</p>
						<div className='flex flex-row justify-center items-end gap-1'>
							<div className={`img-container1 p-2 ${activeDirection === 'left' ? 'filter1' : ''}`}>
								<img className="lazyload" src="/arrow-left.svg" alt="left" />
							</div>
							<div className='flex flex-col justify-center align-center gap-1'>
								<div className={`img-container1 p-2 ${activeDirection === 'up' ? 'filter1' : ''}`}>
									<img className="lazyload" src="/arrow-up.svg" alt="up" />
								</div>
								<div className={`img-container1 p-2 ${activeDirection === 'down' ? 'filter1' : ''}`}>
									<img className="lazyload" src="/arrow-down.svg" alt="down" />
								</div>
							</div>
							<div className={`img-container1 p-2 ${activeDirection === 'right' ? 'filter1' : ''}`}>
								<img className="lazyload" src="/arrow-right.svg" alt="right" />
							</div>

						</div>

					</div>
				</div>
			)}

			{congratz && <AchievementPopUp />
			}
		</div>
	);
};

export default Navbar;
