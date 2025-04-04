<script lang="ts">
	import { browser } from '$app/environment';
	import { Chord } from '@tonaljs/tonal';
	import { onDestroy, onMount } from 'svelte';
	// Import types
	import { signatures } from '$lib/types/signatures';

	// Import stores
	import {
		activeNotes,
		calculateNoteNumber,
		cleanupMidi,
		initializeWebMidi,
		isInitializing,
		midiError,
		midiInputs,
		refreshMidiDevices,
		selectedInput,
		selectInput,
		type MidiNote
	} from '$lib/stores/midi';

	import {
		activeAudioNodes,
		cleanupAudio,
		initAudio,
		loadingProgress,
		playingAudioNodes,
		playNote,
		samplesLoaded,
		stopNote
	} from '$lib/stores/audio';

	import {
		activeTabId,
		closeTab,
		currentSignature,
		loadChordSets,
		loadSavedChords,
		openTabs,
		playingChordId,
		saveCurrentChord as saveChord,
		savedChords,
		setActiveTab
	} from '$lib/stores/chords';
	// Import components
	import ChordDisplay from './ChordDisplay.svelte';
	import ChordProgressionPanel from './ChordProgressionPanel.svelte';
	import ChordSetManager from './ChordSetManager.svelte';
	import Drawer from './Drawer.svelte';
	import Piano from './Piano.svelte';
	import SheetMusic from './SheetMusic.svelte';
	import Tabs from './Tabs.svelte';

	// Local state
	let isMenuOpen = false;
	let isKeyMenuOpen = false;
	let isDrawerOpen = false;
	let currentChords: string[] = [];
	let scaleChords = { major: [], minor: [] };
	let matchingChords = { majorMatches: [], minorMatches: [] };
	let isInfoOpen = false; // For chord notation info

	// Derived state
	$: isInKey = (chord: string) => {
		return scaleChords.major.includes(chord) || scaleChords.minor.includes(chord);
	};

	// Update the current chords when activeNotes changes
	$: if ($activeNotes.length > 0) {
		// Get note names for chord detection
		const noteNames = $activeNotes.map((note) => {
			const name = note.name || '';
			const accidental = note.accidental || '';
			return name + accidental;
		});

		// Sort and deduplicate
		const uniqueNotes = Array.from(new Set(noteNames)).sort();

		// Get chord suggestions
		try {
			currentChords = Chord.detect(uniqueNotes);
		} catch (error) {
			console.error('Error detecting chord:', error);
			currentChords = [];
		}
	} else {
		currentChords = [];
	}

	// Function to toggle the MIDI device menu
	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	// Function to toggle the key signature menu
	function toggleKeyMenu() {
		isKeyMenuOpen = !isKeyMenuOpen;
	}

	// Function to toggle chord notation info
	function toggleInfo() {
		isInfoOpen = !isInfoOpen;
	}

	// Function to change the key signature
	function changeSignature(signature: (typeof signatures)[0]) {
		currentSignature.set(signature);
		isKeyMenuOpen = false;
	}

	// Handle piano key press events
	function handlePianoNotePress(event: {
		detail: { name: string; accidental: string; octave: number; isOn: boolean };
	}) {
		const { name, accidental, octave, isOn } = event.detail;

		if (isOn) {
			// Create a standardized note object
			const note: MidiNote = {
				name: name.toUpperCase(),
				accidental,
				octave,
				number: calculateNoteNumber(name, accidental, octave),
				identifier: `${name}${accidental}${octave}`,
				attack: 0.5,
				release: 0.5
			};

			// Add note to active notes
			activeNotes.update((notes) => [...notes, note]);

			// Play the note
			const nodes = playNote(note.number);
			if (nodes) {
				activeAudioNodes.update((current) => ({
					...current,
					[note.identifier]: nodes
				}));
			}
		} else {
			// Remove note from active notes
			activeNotes.update((notes) =>
				notes.filter(
					(note) =>
						!(
							note.name === name.toUpperCase() &&
							note.accidental === accidental &&
							note.octave === octave
						)
				)
			);

			// Stop the note audio
			const identifier = `${name}${accidental}${octave}`;
			activeAudioNodes.update((current) => {
				const nodes = current[identifier];
				if (nodes) {
					stopNote(nodes);
				}

				// Create a new object without this note
				const newNodes = { ...current };
				delete newNodes[identifier];
				return newNodes;
			});
		}
	}

	// Save the current chord
	function saveCurrentChord() {
		if ($activeNotes.length === 0) return;

		saveChord($activeNotes);
	}

	// Play a saved chord
	function playChord(id: string, notes: any[]) {
		// Stop any currently playing notes first
		$playingAudioNodes.forEach((item) => {
			stopNote(item.nodes);
		});
		playingAudioNodes.set([]);

		// Set the currently playing chord ID
		playingChordId.set(id);

		// Play all notes in the chord
		const newPlayingNodes: Array<{ note: number; nodes: any }> = [];

		notes.forEach((note) => {
			const nodes = playNote(note.number);
			if (nodes) {
				newPlayingNodes.push({ note: note.number, nodes });
			}
		});

		playingAudioNodes.set(newPlayingNodes);

		// Clear the playing chord ID after a delay
		setTimeout(() => {
			if ($playingChordId === id) {
				playingChordId.set(null);
			}
		}, 2000);
	}

	// Function to stop a currently playing chord
	function stopChord() {
		$playingAudioNodes.forEach((item) => {
			stopNote(item.nodes);
		});
		playingAudioNodes.set([]);
		playingChordId.set(null);
	}

	// Listen for keyboard shortcuts
	function handleKeyDown(event: KeyboardEvent) {
		// Space to save chord
		if (event.code === 'Space' && !event.repeat) {
			event.preventDefault(); // Prevent scrolling
			saveCurrentChord();
		}

		// 'P' key to play the most recent chord
		if (event.code === 'KeyP' && !event.repeat && $savedChords.length > 0) {
			event.preventDefault();
			// Get the most recent chord
			const lastChord = $savedChords[$savedChords.length - 1];
			playChord(lastChord.id, lastChord.notes);
		}

		// Ctrl+S to save current progression as a set
		if (event.code === 'KeyS' && event.ctrlKey && !event.repeat) {
			event.preventDefault();
			isDrawerOpen = true;
			setTimeout(() => {
				const saveCurrentBtn = document.querySelector(
					'.chord-sets-manager button[title*="Save current"]'
				);
				if (saveCurrentBtn) {
					(saveCurrentBtn as HTMLButtonElement).click();
				}
			}, 100);
		}
	}

	// Initialize on mount
	onMount(() => {
		// Initialize WebMIDI
		initializeWebMidi();

		// Load saved data
		loadSavedChords();
		loadChordSets();

		// Initialize audio
		initAudio();

		// Add keyboard shortcut listener
		if (browser) {
			window.addEventListener('keydown', handleKeyDown);
		}
	});

	// Clean up on destroy
	onDestroy(() => {
		// Clean up WebMIDI
		cleanupMidi();

		// Clean up audio
		cleanupAudio();

		// Remove keyboard listener
		if (browser) {
			window.removeEventListener('keydown', handleKeyDown);
		}
	});
</script>

<div class="pianoboi-container relative mx-auto mt-6 max-w-7xl px-4 sm:px-6 lg:px-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">PianoBoi</h1>

		<div class="flex items-center space-x-4">
			<!-- MIDI Input Selector -->
			<div class="relative">
				<button
					class="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow hover:bg-gray-50"
					on:click={toggleMenu}
					aria-haspopup="true"
				>
					<!-- MIDI Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 text-purple-600"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M13.6,2.3C12.2,0.9,10,0.1,7.6,0.1c-4.2,0-7.5,3.4-7.5,7.5c0,0,0,0.1,0,0.1h3c0,0,0-0.1,0-0.1
						c0-2.5,2-4.5,4.5-4.5c1.5,0,2.9,0.8,3.6,1.9h-3.3v2.5h3.9h1h1V2.9C14.8,4.1,13.6,2.3,13.6,2.3z M17.5,5.5v9c0,1.7-1.3,3-3,3
						h-9c-1.7,0-3-1.3-3-3v-9c0-1.7,1.3-3,3-3h9C16.2,2.5,17.5,3.8,17.5,5.5z M7.5,8L5,10.5V6.5L7.5,9V8z M15,8l-2.5,2.5V6.5
						L15,9V8z M11.3,9.7c0.4,0.4,0.4,1,0,1.4c-0.4,0.4-1,0.4-1.4,0c-0.4-0.4-0.4-1,0-1.4C10.2,9.3,10.8,9.3,11.3,9.7z"
						/>
					</svg>
					<span class="font-medium text-gray-700">MIDI:</span>
					<span class="ml-1 text-purple-600">
						{#if $selectedInput}
							{$selectedInput.name}
						{:else if $isInitializing}
							Initializing...
						{:else if $midiError}
							Error
						{:else if $midiInputs.length === 0}
							No devices
						{:else}
							Select device
						{/if}
					</span>
					<svg
						class="ml-1 h-4 w-4"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
				</button>

				{#if isMenuOpen}
					<div
						class="absolute left-0 top-full z-30 mt-1 w-64 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
					>
						<div class="mb-2 border-b pb-1 text-sm font-medium text-gray-700">MIDI Devices</div>
						{#if $midiInputs.length === 0}
							<div class="py-2 text-sm text-gray-700">No MIDI inputs available</div>
						{:else}
							<div class="max-h-60 overflow-y-auto">
								{#each $midiInputs as input}
									<button
										class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-purple-50"
										class:bg-purple-100={$selectedInput?.id === input.id}
										on:click={() => {
											selectInput(input);
											isMenuOpen = false;
										}}
									>
										<span class="text-purple-600">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="mr-1 inline h-4 w-4"
												viewBox="0 0 20 20"
												fill="currentColor"
											>
												<path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0z" />
												<path
													d="M12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"
												/>
											</svg>
										</span>
										<span>{input.name}</span>
									</button>
								{/each}
							</div>
						{/if}

						<div class="mt-2 border-t pt-1">
							<button
								class="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-purple-600 transition-colors hover:bg-purple-50"
								on:click={() => {
									refreshMidiDevices();
									isMenuOpen = false;
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mr-1 inline h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
										clip-rule="evenodd"
									/>
								</svg>
								Refresh Devices
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Key Signature Selector -->
			<div class="relative">
				<button
					class="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium shadow hover:bg-gray-50"
					on:click={toggleKeyMenu}
					aria-haspopup="true"
				>
					<!-- Music Note Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 text-blue-600"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"
						/>
					</svg>
					<span class="font-medium text-gray-700">Key:</span>
					<span class="ml-1 text-blue-600">{$currentSignature.id}</span>
					<svg
						class="ml-1 h-4 w-4"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
							clip-rule="evenodd"
						></path>
					</svg>
				</button>

				{#if isKeyMenuOpen}
					<div
						class="absolute left-0 top-full z-30 mt-1 w-80 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
					>
						<div class="mb-2 border-b pb-1 text-sm font-medium text-gray-700">Key Signatures</div>
						<div class="grid grid-cols-2 gap-2">
							{#each signatures as sig}
								<button
									class="flex flex-col items-start rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-blue-50"
									class:bg-blue-100={$currentSignature.id === sig.id}
									on:click={() => changeSignature(sig)}
								>
									<span class="font-medium">{sig.id}</span>
									<span class="text-xs text-gray-500">{sig.label}</span>
									{#if sig.sharps > 0}
										<span
											class="mt-1 inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700"
										>
											{sig.sharps}
											{sig.sharps === 1 ? 'sharp' : 'sharps'}
										</span>
									{:else if sig.flats > 0}
										<span
											class="mt-1 inline-flex items-center rounded-md bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700"
										>
											{sig.flats}
											{sig.flats === 1 ? 'flat' : 'flats'}
										</span>
									{:else}
										<span
											class="mt-1 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-600"
										>
											No sharps/flats
										</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Chord Sets Drawer Toggle -->
			<button
				class="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium shadow hover:bg-blue-100"
				on:click={() => (isDrawerOpen = !isDrawerOpen)}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-blue-600"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
					/>
				</svg>
				<span class="font-medium text-blue-700">Chord Sets</span>
			</button>
		</div>
	</div>

	<!-- Main Content Area -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		<!-- Left - Chord Progression Panel -->
		<div class="relative col-span-2">
			{#if $openTabs.length > 0}
				<Tabs
					tabs={$openTabs}
					activeTabId={$activeTabId}
					on:tabChange={(e) => setActiveTab(e.detail.id)}
					on:tabClose={(e) => closeTab(e.detail.id)}
				/>
			{/if}

			<ChordProgressionPanel onPlayChord={playChord} />
		</div>

		<!-- Right - Controls and Displays -->
		<div class="col-span-1">
			<div class="mb-6 space-y-6 rounded-lg border bg-white p-6 shadow-sm">
				<div class="flex items-center justify-between border-b pb-4">
					<h2 class="text-lg font-semibold text-gray-800">Current Notes</h2>

					<div class="flex items-center">
						<!-- Currently playing indicator -->
						<span class="flex items-center text-xs font-medium text-gray-600">
							{#if $activeNotes.length > 0}
								<span class="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
								></span>
								{$activeNotes.length} notes playing
							{:else}
								<span class="mr-2 inline-block h-2 w-2 rounded-full bg-gray-300"></span>
								No notes playing
							{/if}
						</span>
					</div>
				</div>

				<!-- Sheet music display with chord reference table -->
				<div class="mb-4 min-h-[80px] border-b pb-4">
					<!-- Chord Detection & Reference Table -->
					<div class="flex flex-col gap-4">
						<!-- Sheet Music Display -->
						<div class="flex-1">
							<SheetMusic notes={$activeNotes} signature={$currentSignature} />
							<ChordDisplay notes={$activeNotes} signature={$currentSignature} debug={false} />
						</div>

						<!-- Chord Reference Table -->
						<div class="flex w-full flex-1 flex-col rounded-lg border bg-white p-3 shadow-sm">
							<div class="mb-4 flex items-center justify-between border-b pb-2">
								<h3 class="text-sm font-medium text-gray-700">
									Key: {$currentSignature.label}
								</h3>

								<!-- Info Button -->
								<div class="relative">
									<button
										class="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
										on:click={toggleInfo}
										title="Show chord notation info"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>

									{#if isInfoOpen}
										<div
											class="absolute right-0 top-full z-40 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
										>
											<div class="space-y-2 text-xs text-gray-500">
												<p>
													<span class="font-medium">Major Scale:</span> The highlighted chords are
													the primary chords:
													<span class="font-mono">I</span> (tonic),
													<span class="font-mono">IV</span> (subdominant), and
													<span class="font-mono">V</span> (dominant).
												</p>
												<p>
													Uppercase numerals (I, IV, V) indicate major chords, while lowercase (ii,
													iii, vi) indicate minor chords. The diminished symbol (°) in vii°
													indicates a diminished chord.
												</p>
												<p>
													<span class="font-medium">Minor Scale:</span> The highlighted chords are
													the primary chords:
													<span class="font-mono">i</span> (tonic),
													<span class="font-mono">iv</span> (subdominant), and
													<span class="font-mono">v</span> (dominant).
												</p>
												<p>
													Lowercase numerals (i, ii°, iv, v) indicate minor chords, while uppercase
													(III, VI, VII) indicate major chords. The diminished symbol (°) in ii°
													indicates a diminished chord.
												</p>
											</div>
										</div>
									{/if}
								</div>
							</div>

							<!-- Detected Chords Display -->
							{#if $activeNotes.length > 0}
								<div class="mb-4">
									<h4 class="mb-2 text-sm font-medium text-gray-700">Detected Chords</h4>
									{#if currentChords.length === 0}
										<p class="text-sm text-gray-500">No recognized chord</p>
									{:else}
										<div class="flex flex-wrap gap-2">
											{#each currentChords as chord}
												<span
													class="rounded-full px-3 py-1 text-sm font-medium"
													class:bg-green-100={isInKey(chord)}
													class:text-green-800={isInKey(chord)}
													class:bg-blue-100={!isInKey(chord)}
													class:text-blue-800={!isInKey(chord)}
												>
													{chord}
													{#if isInKey(chord)}
														<span class="ml-1 text-xs text-green-600">(in key)</span>
													{/if}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Save button -->
				<div class="flex justify-center">
					<button
						class="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-600 hover:shadow-md active:scale-95 active:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						on:click={saveCurrentChord}
						title="Save the current chord (Space)"
						disabled={$activeNotes.length === 0}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"
							/>
						</svg>
						<span>Save Chord</span>
						<span class="ml-1 rounded bg-blue-600/80 px-1.5 py-0.5 text-xs font-medium">Space</span>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Sticky player UI at the bottom of the screen -->
	<div
		class="sticky bottom-0 z-20 border-t bg-white pb-3 pt-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
	>
		<div class="container mx-auto">
			<div class="piano-wrapper">
				<Piano
					notes={$activeNotes}
					readonly={false}
					compact={false}
					showLabels={true}
					signature={$currentSignature}
					on:notePress={handlePianoNotePress}
				/>
			</div>

			<!-- Keyboard shortcuts info -->
			<div class="mt-3 border-t pt-2 text-center text-xs text-gray-500">
				{#if $samplesLoaded}
					<p>
						Keyboard shortcuts: <span class="mx-1 rounded bg-gray-200 px-1 py-0.5 font-mono"
							>Space</span
						>
						to save chord,
						<span class="mx-1 rounded bg-gray-200 px-1 py-0.5 font-mono">P</span> to play most
						recent chord,
						<span class="mx-1 rounded bg-gray-200 px-1 py-0.5 font-mono">Ctrl+S</span> to save chord
						set
					</p>
				{:else}
					<div class="flex flex-col items-center">
						<p class="mb-1">Loading piano samples: {$loadingProgress}%</p>
						<div class="h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
							<div class="h-full rounded-full bg-blue-500" style="width: {$loadingProgress}%"></div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Chord Sets Drawer -->
<Drawer isOpen={isDrawerOpen} on:close={() => (isDrawerOpen = false)}>
	<svelte:fragment slot="header">Chord Progressions</svelte:fragment>

	<ChordSetManager onPlayChord={playChord} />

	<svelte:fragment slot="footer">
		<p class="text-center text-xs text-gray-500">
			Use Ctrl+S to quickly save your current chord progression
		</p>
	</svelte:fragment>
</Drawer>
