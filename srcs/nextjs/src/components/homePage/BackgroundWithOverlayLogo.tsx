import React from 'react';
import { useRouter } from 'next/router';
import Button from '../ui/Button';

interface BackgroundWithOverlayLogoProps {
	className?: string;
}

const BackgroundWithOverlayLogo: React.FC<BackgroundWithOverlayLogoProps> = ({ className }) => {
	const router = useRouter();
	const handleGameButton = async () => {
		router.push('/gameIntro');
	};

	return (
		<div
			className={`background-home-logo ${className}`}
			style={{
				backgroundImage: `url('/main.svg')`,
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				backgroundSize: 'cover',
				borderRadius: '16px',
				border: '1px solid white',
			}}
		>
			<div className="absolute flex flex-col items-center justify-center space-y-9 w-full h-full">
				<img
					className="object-contain background-responsive"
					src="/logo-upt.svg" alt="Your Logo"
				/>
				<Button onClick={handleGameButton}>
					START PLAYING
				</Button>
			</div>
		</div>
	);
};

export default BackgroundWithOverlayLogo;
