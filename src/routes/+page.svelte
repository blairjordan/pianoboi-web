<script lang="ts">
	// Landing page for pianoboi
</script>

<svelte:head>
	<title>pianoboi - Interactive MIDI Piano</title>
	<meta
		name="description"
		content="Interactive piano with chord detection and sheet music display. Learn to play piano with real-time chord recognition and visualization."
	/>
	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://pianoboi.com/" />
	<meta property="og:title" content="pianoboi - Interactive MIDI Piano" />
	<meta
		property="og:description"
		content="Interactive piano with chord detection and sheet music display. Learn to play piano with real-time chord recognition and visualization."
	/>
	<meta property="og:site_name" content="pianoboi" />
	<meta property="og:locale" content="en_US" />
	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content="https://pianoboi.com/" />
	<meta property="twitter:title" content="pianoboi - Interactive MIDI Piano" />
	<meta
		property="twitter:description"
		content="Interactive piano with chord detection and sheet music display. Learn to play piano with real-time chord recognition and visualization."
	/>
	<!-- Canonical URL -->
	<link rel="canonical" href="https://pianoboi.com/" />
	<!-- Keywords -->
	<meta
		name="keywords"
		content="piano, MIDI, chord detection, sheet music, music learning, interactive piano, learn piano, keyboard online, pianoboi"
	/>
	<!-- Additional SEO tags -->
	<meta name="author" content="pianoboi" />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebApplication",
			"name": "pianoboi",
			"url": "https://pianoboi.com",
			"description": "Interactive piano with chord detection and sheet music display. Learn to play piano with real-time chord recognition and visualization.",
			"applicationCategory": "MusicApplication",
			"operatingSystem": "Any",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "USD"
			},
			"featureList": [
				"MIDI compatibility",
				"Chord detection",
				"Sheet music display",
				"Save and organize chords",
				"Free to use"
			]
		}
	</script>
</svelte:head>

<main class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
		<!-- Hero section -->
		<div class="mb-16 text-center">
			<h1 class="mb-4 text-5xl font-bold text-gray-900">pianoboi</h1>
			<p class="mx-auto max-w-3xl text-xl text-gray-600">
				An interactive MIDI piano with chord detection and sheet music display
			</p>
			<div class="mt-8">
				<a
					href="/app"
					class="inline-block rounded-lg bg-blue-500 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-blue-600"
				>
					🎹 Begin Playing
				</a>
				<p class="mt-2 text-sm text-gray-600">No login required — start playing instantly</p>
			</div>

			<!-- Contribution section -->
			<div class="mt-12 rounded-lg border-l-4 border-green-500 bg-white p-8 shadow-sm">
				<div class="text-center">
					<div class="mb-4 text-green-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mx-auto h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
							/>
						</svg>
					</div>
					<h2 class="mb-4 text-2xl font-bold text-gray-900">Help Us Improve pianoboi</h2>
					<p class="mx-auto mb-6 max-w-2xl text-lg text-gray-600">
						Found a bug? Have a feature request? We'd love your help! pianoboi is an open-source
						project, and your contributions make it better for everyone.
					</p>
					<a
						href="https://github.com/blairjordan/pianoboi-web"
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center rounded-lg bg-green-500 px-6 py-3 font-medium text-white shadow-md transition-colors hover:bg-green-600"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
							/>
						</svg>
						Open a Pull Request
					</a>
					<p class="mt-3 text-sm text-gray-500">
						Whether it's a bug report, feature request, or code contribution — All help is welcome!
					</p>
				</div>
			</div>
		</div>

		<!-- Features section -->
		<div class="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-3 text-blue-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">MIDI Compatible</h3>
				<p class="text-gray-600">
					Connect your MIDI keyboard or piano and play in real-time with instant chord detection
				</p>
			</div>

			<!-- Cost feature card -->
			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-3 text-blue-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">100% Free</h3>
				<p class="text-gray-600">
					No subscription, no payments, no hidden fees. Just open and play.
				</p>
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm">
				<div class="mb-3 text-blue-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">Save & Organize</h3>
				<p class="text-gray-600">
					Save your chords and organize them into sets for practice or composition
				</p>
			</div>
		</div>

		<!-- FAQ section -->
		<div class="mb-16">
			<h2 class="mb-8 text-center text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>

			<div class="mx-auto max-w-4xl space-y-6">
				<!-- Cost/pricing FAQ - placed first to make it prominent -->
				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">Is pianoboi free to use?</h3>
					<p class="text-gray-600">
						Yes, pianoboi is completely free to use. There are no subscriptions, no premium tiers,
						and no hidden fees. All features are available to everyone without any cost. You don't
						even need to create an account to use the app.
					</p>
				</div>

				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">
						Why can't I hear sound when I play?
					</h3>
					<p class="text-gray-600">
						The current version has basic sound playback that loads piano samples in the browser.
						This is meant as a reference but doesn't fully replace a proper MIDI output device. For
						the best experience, we recommend using an external MIDI instrument or synthesizer. We
						plan to improve browser-based sound synthesis in future updates.
					</p>
				</div>

				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">
						I can't play chords by clicking with my mouse. Is this a bug?
					</h3>
					<p class="text-gray-600">
						pianoboi is primarily designed for hardware MIDI input from a piano keyboard or MIDI
						controller. While you can click piano keys with your mouse, it's difficult to play
						multiple notes simultaneously. For the best experience, connect a MIDI keyboard. If you
						don't have a MIDI device, you can use your computer keyboard with MIDI emulation
						software, though this isn't directly supported in the app.
					</p>
				</div>

				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">Which browsers are supported?</h3>
					<p class="text-gray-600">
						pianoboi works best in Chrome and Firefox, which fully support the WebMIDI API. Safari
						has limited support for WebMIDI due to security and privacy considerations. For the best
						experience, we recommend using the latest version of Chrome or Firefox. If you're having
						compatibility issues, please try updating your browser.
					</p>
				</div>

				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">
						Do I need a MIDI keyboard to use pianoboi?
					</h3>
					<p class="text-gray-600">
						While pianoboi is optimized for use with a MIDI keyboard or controller, you can still
						use the on-screen keyboard by clicking with your mouse. This is useful for exploring the
						app's features, but for a full experience, a MIDI input device is recommended. Both
						USB-MIDI and traditional MIDI connections (via an interface) are supported.
					</p>
				</div>

				<div class="rounded-lg border-l-4 border-blue-500 bg-white p-6 shadow-sm">
					<h3 class="mb-2 text-lg font-medium text-gray-900">How do I save my chords?</h3>
					<p class="text-gray-600">
						Press the Space bar to save the currently played chord. You can organize saved chords
						into sets using the Set dropdown menu. Chords are automatically saved in your browser's
						local storage, so they will persist between sessions on the same device and browser.
					</p>
				</div>
			</div>
		</div>

		<footer class="border-t pt-8 text-center text-sm text-gray-500">
			<p class="mt-2">© 2025 pianoboi</p>
		</footer>
	</div>
</main>
