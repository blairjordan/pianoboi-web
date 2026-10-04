import { useEffect } from 'react';
import LandingPage from './LandingPage';
import PianoBoi from './lib/components/PianoBoi';

export default function App() {
	const isPianoApp =
		window.location.pathname === '/app' || window.location.pathname.startsWith('/app/');
	useEffect(() => {
		if (isPianoApp) document.title = 'pianoboi - Interactive MIDI Piano';
	}, [isPianoApp]);
	return isPianoApp ? <PianoBoi /> : <LandingPage />;
}
