import { useEffect } from 'react';

const features = [
	{
		icon: 'fa-music',
		title: 'MIDI Compatible',
		text: 'Connect your MIDI keyboard or piano and play in real-time with instant chord detection.'
	},
	{
		icon: 'fa-circle-dollar-to-slot',
		title: '100% Free',
		text: 'No subscription, no payments, no hidden fees. Just open and play.'
	},
	{
		icon: 'fa-folder-open',
		title: 'Save & Organize',
		text: 'Save your chords and organize them into sets for practice or composition.'
	}
];

const faqs = [
	{
		question: 'Is pianoboi free to use?',
		answer:
			'Yes, pianoboi is completely free to use. There are no subscriptions, premium tiers, hidden fees, or account requirements.'
	},
	{
		question: "Why can't I hear sound when I play?",
		answer:
			'Your browser may pause audio until you interact with the page. Click a piano key once and check that your device volume is on.'
	},
	{
		question: 'Do I need a MIDI keyboard?',
		answer:
			'No. You can play the on-screen keyboard with your mouse or trackpad, though a MIDI device gives you a more natural playing experience.'
	},
	{
		question: 'Where are my saved chords stored?',
		answer:
			'Your chords and sets are stored locally in your browser, so they remain private and available on this device.'
	}
];

export default function LandingPage() {
	useEffect(() => {
		document.title = 'pianoboi - Interactive MIDI Piano';
	}, []);
	return (
		<main className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
				<div className="mb-16 text-center">
					<h1 className="mb-4 text-5xl font-bold text-gray-900">pianoboi</h1>
					<p className="mx-auto max-w-3xl text-xl text-gray-600">
						An interactive MIDI piano with chord detection and sheet music display
					</p>
					<div className="mt-8">
						<a
							href="/app"
							className="inline-block rounded-lg bg-blue-500 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-blue-600"
						>
							🎹 Begin Playing
						</a>
						<p className="mt-2 text-sm text-gray-600">
							No login required — start playing instantly
						</p>
					</div>
					<div className="mt-12 rounded-lg border-l-4 border-green-500 bg-white p-8 shadow-sm">
						<i className="fas fa-people-group mb-4 text-5xl text-green-500" />
						<h2 className="mb-4 text-2xl font-bold text-gray-900">Help Us Improve pianoboi</h2>
						<p className="mx-auto mb-6 max-w-2xl text-lg text-gray-600">
							Found a bug or have a feature request? pianoboi is open source, and your contributions
							make it better for everyone.
						</p>
						<a
							href="https://github.com/blairjordan/pianoboi-web"
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center rounded-lg bg-green-500 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-green-600"
						>
							<i className="fab fa-github mr-2" /> Open a Pull Request
						</a>
					</div>
				</div>
				<div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
					{features.map((feature) => (
						<div className="rounded-lg bg-white p-6 shadow-sm" key={feature.title}>
							<i className={`fas ${feature.icon} mb-3 text-3xl text-blue-500`} />
							<h3 className="mb-2 text-lg font-medium text-gray-900">{feature.title}</h3>
							<p className="text-gray-600">{feature.text}</p>
						</div>
					))}
				</div>
				<div className="mb-16">
					<h2 className="mb-8 text-center text-3xl font-bold text-gray-900">
						Frequently Asked Questions
					</h2>
					<div className="mx-auto max-w-4xl space-y-6">
						{faqs.map((faq) => (
							<div
								className="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm"
								key={faq.question}
							>
								<h3 className="mb-2 text-lg font-medium text-gray-900">{faq.question}</h3>
								<p className="text-gray-600">{faq.answer}</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}
