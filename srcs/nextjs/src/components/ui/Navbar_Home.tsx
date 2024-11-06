import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';

type NavbarHomeProps = {
	className?: string;
};

export const NavbarHome: React.FC<NavbarHomeProps> = ({ className }) => {
	const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
	const profileMenuRef = useRef<HTMLDivElement | null>(null);
	const router = useRouter();
	const [isValModalOpen, setValModalOpen] = useState(false);
	const [isHovered, setIsHovered] = useState(false);

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};
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


	const handleHomeClick = () => {
		if (router.pathname !== '/home') {
			router.push('/home');
		}
	};

	const openValModal = () => {
		setValModalOpen(true);
	};

	const closeValModal = () => {
		setValModalOpen(false);
	};

	return (
		<div className="flex w-full h-[90px] justify-between items-center p-5 box-border top-0">
			<div className="flex items-center">
				<button onClick={handleHomeClick}>
					<img className="lazyload" src="/left-side.svg" alt="Home" />
				</button>
			</div>
			<div className="flex justify-between items-center w-[150px]">
				<div>
					<button>
						<img className="lazyload" onClick={openValModal} src="/theme-icon.svg" alt="Theme" />
					</button>

				</div>
				<div>
					<button>
						<img className="lazyload darken-overlay" src="/chat-icon.svg" alt="Chat" />
					</button>
				</div>
				<div className="relative">
					<button>
						<img className="lazyload darken-overlay" src="/user-icon.svg" alt="User" />
					</button>
				</div>
			</div>
			{isValModalOpen && (
				<div className='modal p-8'>
					<div className='modal-content p-4 gap-10 relative max-h-[90vh] overflow-y-auto'>
						<button
							onClick={closeValModal}
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
						<div className='overflow-y-auto'>
							<p className='font pb-4 mb-10'>CHER VALENTIN,</p>
							<div className='gap-5 overflow-y-auto'>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">Nous voulions prendre un moment pour t'exprimer notre immense gratitude pour ton incroyable contribution à notre projet "Ultimate Pong Transcendance". Ton travail sur les graphismes et le design a été absolument phénoménal, et nous sommes extrêmement fiers du résultat final.</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">Ton talent artistique a donné vie à notre vision d'une manière que nous n'aurions jamais pu imaginer sans toi. Les détails, la créativité et l'attention que tu as apportés à chaque élément visuel sont tout simplement remarquables. Ton travail a ajouté une dimension entièrement nouvelle et captivante à notre jeu, le rendant plus attrayant et mémorable que nous ne l'aurions jamais cru possible.</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">Ton dévouement et ton professionnalisme tout au long du projet ont été exemplaires, et travailler avec toi a été un véritable plaisir. Ton ouverture à nos idées et tes précieux conseils ont grandement enrichi notre expérience de travail ensemble.</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">Encore une fois, merci du fond du cœur pour tout ce que tu as fait. Ton travail a fait une différence significative dans notre projet, et nous savons que cela laissera une impression durable sur tous ceux qui joueront à "Ultimate Pong Transcendance".</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">C'était vraiment un plaisir de travailler avec toi, je n'en ai jamais douté. Nous sommes reconnaissants de t'avoir eu comme collaborateur et pour ma part comme ami. J'espère sincèrement que les occasions pourront se représenter à l'avenir pour recollaborer!</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center text-white">J'espère que cette expérience t'apportera dans ton projet d'ambition qui est de devenir le meilleur dans le domaine du webdesign avancé !</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center justify-center text-white">Avec une profonde gratitude,</p>
								<p className="flex font-press-start-2p text-[12px] mb-5 text-center justify-center text-white">Fanny et toute l'équipe de "Ultimate Pong Transcendance" : Céline, Manon et Benjamin</p>
							</div>
							<div className="flex font-press-start-2p text-[12px] text-white">
								<div className="flex flex-grow justify-center aligns-center items-center mt-4">

									<a href="https://www.visual-workshop.fr" target="_blank" rel="noopener noreferrer">
										<div className="flex m-auto flex-grow">
											<img src="logo-visualworkshop.png" alt="visual-workshop" className="mr-2" style={{ width: '200px', height: 'auto' }} />
											<p className='cursor-pointer'>
												visual-workshop.fr
											</p>
										</div>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

		</div>
	);
};
