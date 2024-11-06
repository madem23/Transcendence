import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useState } from 'react';
import { NextPage } from 'next';
import { useRef } from 'react';
import useAuthStatus from '@/hooks/useAuthStatus';
import DropdownMenu from '@/components/ui/DropdownMenu';
import Paragraph from '@/components/ui/Paragraph';
import { useUserContext } from '@/contexts/UserContext';
import RegisterForm from '@/components/ui/RegisterForm';
import { toast } from '@/ui/Toast'; // Replace with actual path to your toast component.
import { useWebsocketContext } from '@/contexts/WebsocketContext';
import LoginForm from '@/components/ui/Login';
import TwoFaForm from '@/components/accueilPage/TwoFaForm';
import StarField from '@/components/starsComponent';

const Home: NextPage = () => {
	const [showDropdown, setShowDropdown] = useState<boolean>(false);
	const [isModalRegister, setModalRegister] = useState(false);
	const [isModalLogin, setModalLogin] = useState(false);
	const [isModal2FA, setModal2FA] = useState(false);
	const dropdownRef = useRef<HTMLDivElement | null>(null);
	const isLoggedIn = useAuthStatus();
	const router = useRouter();
	const [isHovered, setIsHovered] = useState(false);
	const socket = useWebsocketContext();

	function isValidEmail(email: string): boolean {
		const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
		return emailRegex.test(email);
	}

	const handleSubmitRegister = async (form: HTMLFormElement): Promise<void> => {
		const formData = new FormData(form);

		const login = formData.get('username');
		const password = formData.get('password');
		if (!login || !password) {
			toast({
				title: 'Username or password is empty',
				message: 'Please enter a valid email address and password.',
				type: 'error',
			});
			return;
		}

		const loginStr = login.toString();
		const passwordStr = password.toString();

		if (!isValidEmail(loginStr)) {
			toast({
				title: 'Invalid Email',
				message: 'Please enter a valid email address.',
				type: 'error',
			});
			return;
		}

		try {
			const response = await fetch(`/api/users/local-register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					login: loginStr,
					password: passwordStr,
				}),
				credentials: 'include',
			});
			const responseBody = await response.text();

			if (response.ok) {
				toast({
					title: 'Success',
					message: 'Registration successful. Please log in.',
					type: 'success',
				});
				setModalRegister(false);
				setModalLogin(true);
			} else {
				toast({
					title: 'Error',
					message: 'You did not successfully register.',
					type: 'error',
				});
			}
		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	const handleSubmit = async (form: HTMLFormElement) => {
		const formData = new FormData(form);
		const loginValue = formData.get('username');
		const passwordValue = formData.get('password');
		const login = loginValue;
		const password = passwordValue as string;

		try {
			const response = await fetch(`/api/auth/local-login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					login: login,
					password: password,
				}),
				credentials: 'include',
			});

			let responseBody;
			if (response.headers.get("content-type")?.includes("application/json")) {
				responseBody = await response.json();
			} else {
				responseBody = await response.text();
			}

			if (response.ok) {
				socket?.emit('userLogIn', {
					user: responseBody.username,
				});
				router.push('/home');
			} else if (response.status === 401 && responseBody.redirect === '/2FAcode') {
				setModal2FA(true);
			} else {
				toast({
					title: "Login Failed",
					message: "Please try again.",
					type: "error"
				});
			}
		} catch (error) {
			console.error('Error occurred:', error);
		}
	};

	const handleMouseEnter = () => {
		setIsHovered(true);
	};

	const handleMouseLeave = () => {
		setIsHovered(false);
	};

	const handleCloseModal = () => {
		setModalRegister(false);
		setModalLogin(false);
		setModal2FA(false);
	}

	useEffect(() => {
		if (isLoggedIn === true) {
			router.push('/home');
		}
	}, [isLoggedIn]);

	const handleSignIn = (event: any) => {
		setShowDropdown(!showDropdown);

	};

	const handleSignUp = () => {
		setModalRegister(true);
	};

	const handleSignInLocal = () => {
		setModalLogin(true);
		setShowDropdown(false);
	};

	const handleSignInIntra = () => {
		const url = process.env.NEXT_PUBLIC_INTRA_SIGNURL;
		if (url)
			window.location.href = url;
		setShowDropdown(false);
	};

	const handleClickOutside = (event: MouseEvent) => {
		if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
			setShowDropdown(false);
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [])

	const backgroundRef = useRef<HTMLDivElement>(null);

	return (
		<div
			ref={backgroundRef}
			className="h-full w-full flex flex-col justify-center items-center homebg">
			<div className='gradient-overlay flex-grow w-full flex flex-col justify-center items-center'>
				<StarField selector=".homebg" />
				<img className="mb-4 homelogo z-index-[999]" src="/logo-upt.svg" alt="Your Logo" />

				<div className="w-64 h-10 justify-center items-center gap-0.5 inline-flex relative"> {/* Ajout de "relative" ici */}
					<button onClick={handleSignIn}>
						<img src="/sign-in.svg" alt="Sign In" />
					</button>
					<DropdownMenu isTranslate={false} show={showDropdown} onClose={() => setShowDropdown(false)} style={{
						transform: 'translateY(55px) translateX(-70px)'

					}}>
						<button onClick={handleSignInLocal} className="block px-4 py-2 text-white hover:bg-gray-700">
							<Paragraph>
								Sign In Local
							</Paragraph>
						</button>
						<button onClick={handleSignInIntra} className="block px-4 py-2 text-white hover:bg-gray-700">
							<Paragraph>
								Sign In Intra
							</Paragraph>
						</button>
					</DropdownMenu>

					<button onClick={handleSignUp}>
						<img src="/sign-up.svg" alt="Sign Up" />
					</button>
				</div>
			</div>

			{isModalRegister && (
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

						<RegisterForm onSubmit={handleSubmitRegister} />
					</div>
				</div>
			)}


			{isModalLogin && (
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

						<LoginForm onSubmit={handleSubmit} />
					</div>
				</div>
			)}


			{isModal2FA && (
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

						<TwoFaForm />
					</div>
				</div>
			)}
		</div>

	);
};

export default Home;
