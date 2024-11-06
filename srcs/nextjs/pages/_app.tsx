import { AppProps } from 'next/app';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/ui/Providers';
import Navbar from '@/components/ui/Navbar';
import { NavbarHome } from '@/components/ui/Navbar_Home';
import '@/styles/globals.css';
import Footer from '@/components/ui/Footer';
import { useEffect } from 'react';
import Modal from 'react-modal';
import { useRouter } from 'next/router';



export default function MyApp({ Component, pageProps }: AppProps) {

	const router = useRouter();

	useEffect(() => {
		if (typeof window !== 'undefined' && window.document) {
			Modal.setAppElement('#__next');
		}
	}, []);

	let NavBarComponent;

	if (router.pathname === '/' || router.pathname === '/login' || router.pathname === '/register' || router.pathname === '/2FAcode') {
		NavBarComponent = <NavbarHome className="flex-shrink-0" />
	} else {
		NavBarComponent = <Navbar className="flex-shrink-0" />
	}

	return (
		<div className="app-container text-slate-900 antialiased">
			<Providers>
				{NavBarComponent}

				<div className="flex-grow overflow-y-auto">
					<Component {...pageProps} />
				</div>
				<Footer className="footer" />
				<div style={{ zIndex: 9999 }}>
					<Toaster position='bottom-right' />
				</div>
			</Providers>
		</div>
	);
}

