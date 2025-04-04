<script lang="ts">
	import type { Signature } from '$lib/types/signatures';
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Note } from 'webmidi';

	export let notes: Note[] = [];
	export let readonly = false; // Add readonly prop to disable interaction
	export let compact = false; // Compact display in saved keyboards
	export let showLabels = false; // Add showLabels prop to display note names consistently
	export let signature: Signature; // Add signature prop to determine flat/sharp display

	// For dispatching note events to parent
	const dispatch = createEventDispatcher();

	// State
	let activeKeys: string[] = [];
	let container: HTMLDivElement;
	// Track which keys are currently being pressed with the mouse
	let mouseDownKeys: Set<string> = new Set();
	// Track whether the mouse button is down
	let isMouseDown = false;

	// Update active keys when notes change
	$: {
		if (notes) {
			activeKeys = notes
				.map((note) => {
					try {
						// Cast to any to allow access to both public and private properties
						const noteAny = note as any;
						// Handle both regular notes (name) and WebMidi notes (_name)
						const name = (noteAny.name || noteAny._name || '').toLowerCase();
						const accidental = noteAny.accidental || noteAny._accidental || '';
						const octave = noteAny.octave || noteAny._octave;

						// Convert sharp to flat or vice versa based on key signature
						let displayAccidental = accidental;
						if (isFlatKey && accidental === '#') {
							// Convert sharp to flat for flat keys
							const sharpToFlatMap: Record<string, string> = {
								'c#': 'db',
								'd#': 'eb',
								'f#': 'gb',
								'g#': 'ab',
								'a#': 'bb'
							};
							const noteWithSharp = name + accidental;
							if (noteWithSharp in sharpToFlatMap) {
								const flatNote = sharpToFlatMap[noteWithSharp];
								return `${flatNote[0]}b${octave}`;
							}
						} else if (!isFlatKey && accidental === 'b') {
							// Convert flat to sharp for sharp keys
							const flatToSharpMap: Record<string, string> = {
								db: 'c#',
								eb: 'd#',
								gb: 'f#',
								ab: 'g#',
								bb: 'a#'
							};
							const noteWithFlat = name + accidental;
							if (noteWithFlat in flatToSharpMap) {
								const sharpNote = flatToSharpMap[noteWithFlat];
								return `${sharpNote[0]}#${octave}`;
							}
						}

						return `${name}${displayAccidental}${octave}`;
					} catch (err) {
						console.error('Error processing note:', note, err);
						return '';
					}
				})
				.filter((key) => key !== ''); // Filter out any empty keys from errors
		}
	}

	// Build keys for all octaves
	const octaves = [1, 2, 3, 4, 5, 6, 7]; // Extended range C1-B7
	const naturalKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

	// Standard piano black key positions (always in sharp positions)
	const blackKeyPositions = [
		{ note: 'C', offset: 0 }, // C#
		{ note: 'D', offset: 1 }, // D#
		{ note: 'F', offset: 3 }, // F#
		{ note: 'G', offset: 4 }, // G#
		{ note: 'A', offset: 5 } // A#
	];

	// Mapping for flat keys (when in a flat key, show flat labels but keep sharp positions)
	const flatKeyMapping: Record<string, string> = {
		'C#': 'Db',
		'D#': 'Eb',
		'F#': 'Gb',
		'G#': 'Ab',
		'A#': 'Bb'
	};

	// Determine if we're in a flat key
	$: isFlatKey = signature?.flats > 0;

	function handleNotePress(note: string, accidental: string, octave: number, isOn: boolean) {
		if (readonly) return; // Ignore if in readonly mode

		console.log('Note press:', note, accidental, octave, isOn);

		// Get a unique key identifier
		const keyId = `${note.toLowerCase()}${accidental}${octave}`;

		// Track key state in mouseDownKeys
		if (isOn) {
			mouseDownKeys.add(keyId);
		} else {
			mouseDownKeys.delete(keyId);
		}

		dispatch('notePress', {
			name: note,
			accidental,
			octave,
			isOn
		});
	}

	function handleMouseDown(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		// Set global mouse state
		isMouseDown = true;

		// Add focus to ensure we get blur events
		const target = event.currentTarget as HTMLDivElement;
		target.focus();

		// Track this specific key
		const keyId = `${note.toLowerCase()}${accidental}${octave}`;
		mouseDownKeys.add(keyId);

		handleNotePress(note, accidental, octave, true);

		// Add global mouse up handler
		window.addEventListener('mouseup', handleGlobalMouseUp, { once: true });
	}

	function handleMouseUp(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		isMouseDown = false;

		// Only release if this key was actually being pressed
		const keyId = `${note.toLowerCase()}${accidental}${octave}`;
		if (mouseDownKeys.has(keyId)) {
			mouseDownKeys.delete(keyId);
			handleNotePress(note, accidental, octave, false);
		}
	}

	function handleGlobalMouseUp() {
		isMouseDown = false;

		// Convert Set to Array for iteration
		Array.from(mouseDownKeys).forEach((keyId) => {
			// Parse the key ID back into components
			const match = keyId.match(/([a-g])(#|b)?(\d+)/);
			if (match) {
				const [_, note, accidental = '', octave] = match;
				handleNotePress(note.toUpperCase(), accidental, parseInt(octave), false);
			}
		});

		// Clear the set
		mouseDownKeys.clear();
	}

	function handleMouseLeave(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		// Only turn off if mouse button is released
		// This prevents keys from releasing when slightly moving the mouse
		if (!isMouseDown) {
			const keyId = `${note.toLowerCase()}${accidental}${octave}`;
			if (mouseDownKeys.has(keyId)) {
				mouseDownKeys.delete(keyId);
				handleNotePress(note, accidental, octave, false);
			}
		}
	}

	// Determine which octaves to show
	$: displayOctaves = compact ? octaves : octaves;

	// Determine if labels should be visible
	$: showNotesLabels = !compact || showLabels;

	// Center the keyboard on load
	onMount(() => {
		setTimeout(() => {
			if (container) {
				// Center the keyboard on middle C
				const totalWidth = container.scrollWidth;
				const viewportWidth = container.clientWidth;
				const scrollToPosition = (totalWidth - viewportWidth) / 2;
				container.scrollLeft = scrollToPosition;
			}
		}, 50);

		// Clean up event listeners
		return () => {
			window.removeEventListener('mouseup', handleGlobalMouseUp);
		};
	});
</script>

<div class="piano-wrapper w-full overflow-hidden">
	<div
		class="piano-container scrollbar-width-thin flex select-none overflow-x-auto pb-2 pt-1"
		bind:this={container}
		class:non-interactive={readonly}
		class:compact-container={compact}
	>
		{#each displayOctaves as octave}
			<div class="octave-container relative flex">
				{#each naturalKeys as note}
					<!-- White key -->
					<button
						class="white-key flex cursor-pointer items-end justify-center border border-gray-300 bg-white pb-2"
						class:active={activeKeys.includes(`${note.toLowerCase()}${octave}`)}
						class:h-32={!compact}
						class:h-24={compact}
						class:w-[1.8rem]={!compact}
						class:w-[1.4rem]={compact}
						on:mousedown={(e) => handleMouseDown(e, note, '', octave)}
						on:mouseup={(e) => handleMouseUp(e, note, '', octave)}
						on:mouseleave={(e) => handleMouseLeave(e, note, '', octave)}
						on:blur={() => !readonly && handleNotePress(note, '', octave, false)}
					>
						<!-- Note label shown based on showNotesLabels -->
						{#if showNotesLabels}
							<span class="text-xs font-semibold text-gray-400">{note}</span>
						{/if}
					</button>
				{/each}

				<!-- Black keys (positioned over white keys) -->
				{#each blackKeyPositions as { note, offset }}
					{@const sharpNote = note + '#'}
					{@const displayNote = isFlatKey ? flatKeyMapping[sharpNote] : sharpNote}
					{@const accidental = isFlatKey ? 'b' : '#'}
					{@const baseNote = isFlatKey ? displayNote[0] : note}
					<!-- Black key - positioned absolutely -->
					<button
						class="black-key absolute top-0 z-10 cursor-pointer bg-gray-800 text-white"
						class:active={activeKeys.includes(`${baseNote.toLowerCase()}${accidental}${octave}`)}
						class:h-20={!compact}
						class:h-14={compact}
						style="left: calc({offset} * {compact ? '1.4rem' : '1.8rem'} + {compact
							? '0.95rem'
							: '1.25rem'}); width: {compact ? '0.9rem' : '1.1rem'};"
						on:mousedown={(e) => handleMouseDown(e, baseNote, accidental, octave)}
						on:mouseup={(e) => handleMouseUp(e, baseNote, accidental, octave)}
						on:mouseleave={(e) => handleMouseLeave(e, baseNote, accidental, octave)}
						on:blur={() => !readonly && handleNotePress(baseNote, accidental, octave, false)}
					>
						<!-- Note label shown based on showNotesLabels -->
						{#if showNotesLabels}
							<span class="absolute bottom-2 left-0 right-0 text-center text-[0.6rem] font-medium"
								>{displayNote}</span
							>
						{/if}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.piano-container {
		-webkit-overflow-scrolling: touch;
		scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
	}

	.piano-container::-webkit-scrollbar {
		height: 6px;
	}

	.piano-container::-webkit-scrollbar-track {
		background: transparent;
	}

	.piano-container::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.2);
		border-radius: 20px;
	}

	.white-key.active {
		background-color: #3b82f6;
		border-color: #2563eb;
	}

	.black-key.active {
		background-color: #3b82f6;
	}

	.non-interactive {
		pointer-events: none;
	}

	.piano-container.overflow-x-hidden {
		overflow-x: auto !important;
		max-width: 100%;
	}

	.piano-wrapper {
		max-width: 100%;
		position: relative;
	}

	.compact-container {
		max-width: 100%;
		overflow-x: hidden !important;
	}

	@media (max-width: 640px) {
		.white-key:not(.compact) {
			height: 7rem;
		}
	}
</style>
