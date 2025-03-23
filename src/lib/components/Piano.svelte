<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { Note } from 'webmidi';

	export let notes: Note[] = [];
	export let readonly = false; // Add readonly prop to disable interaction
	export let compact = false; // Compact display in saved keyboards
	export let showLabels = false; // Add showLabels prop to display note names consistently

	// For dispatching note events to parent
	const dispatch = createEventDispatcher();

	// State
	let activeKeys: string[] = [];
	let container: HTMLDivElement;

	// Update active keys when notes change
	$: {
		if (notes) {
			activeKeys = notes.map(
				(note) => {
					try {
						// Cast to any to allow access to both public and private properties
						const noteAny = note as any;
						// Handle both regular notes (name) and WebMidi notes (_name)
						const name = (noteAny.name || noteAny._name || '').toLowerCase();
						const accidental = noteAny.accidental || noteAny._accidental || '';
						const octave = noteAny.octave || noteAny._octave;
						return `${name}${accidental}${octave}`;
					} catch (err) {
						console.error('Error processing note:', note, err);
						return '';
					}
				}
			).filter(key => key !== ''); // Filter out any empty keys from errors
		}
	}

	// Build keys for all octaves
	const octaves = [1, 2, 3, 4, 5, 6, 7]; // Extended range C1-B7
	const naturalKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
	const sharpKeys = ['C#', 'D#', 'F#', 'G#', 'A#'];

	function handleNotePress(note: string, accidental: string, octave: number, isOn: boolean) {
		if (readonly) return; // Ignore if in readonly mode

		console.log('Note press:', note, accidental, octave, isOn);
		dispatch('notePress', {
			name: note,
			accidental,
			octave,
			isOn
		});
	}

	function handleMouseDown(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		// Add focus to ensure we get blur events
		const target = event.currentTarget as HTMLDivElement;
		target.focus();

		handleNotePress(note, accidental, octave, true);
	}

	function handleMouseUp(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		handleNotePress(note, accidental, octave, false);
	}

	function handleMouseLeave(event: MouseEvent, note: string, accidental: string, octave: number) {
		if (readonly) return; // Ignore if in readonly mode

		// Only turn off if the button was already pressed
		const keyId = `${note.toLowerCase()}${accidental}${octave}`;
		if (activeKeys.includes(keyId)) {
			handleNotePress(note, accidental, octave, false);
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
	});
</script>

<div class="piano-wrapper w-full overflow-hidden">
	<div
		class="piano-container flex pb-2 pt-1 bg-[hsl(24,10%,90%)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
		class:overflow-x-auto={!compact}
		class:overflow-x-hidden={compact}
		bind:this={container}
		class:non-interactive={readonly}
	>
		{#each displayOctaves as octave}
			<div class="octave-container relative flex">
				{#each naturalKeys as note}
					<!-- White key -->
					<div
						class="white-key flex cursor-pointer items-end justify-center border border-gray-300 bg-white pb-2 transition-colors"
						class:active={activeKeys.includes(`${note.toLowerCase()}${octave}`)}
						class:h-32={!compact}
						class:h-24={compact}
						class:w-[1.8rem]={!compact}
						class:w-[1.4rem]={compact}
						tabindex="0"
						on:mousedown={(e) => handleMouseDown(e, note, '', octave)}
						on:mouseup={(e) => handleMouseUp(e, note, '', octave)}
						on:mouseleave={(e) => handleMouseLeave(e, note, '', octave)}
						on:blur={() => !readonly && handleNotePress(note, '', octave, false)}
					>
						<!-- Note label shown based on showNotesLabels -->
						{#if showNotesLabels}
							<span class="text-xs font-semibold text-gray-400">{note}{octave}</span>
						{/if}
					</div>
				{/each}

				<!-- Black keys (positioned over white keys) -->
				{#each sharpKeys as sharpNote}
					{@const baseNote = sharpNote[0]}
					{@const position = naturalKeys.indexOf(baseNote)}
					{@const offset = position === 2 ? position + 1 : position}
					<!-- Black key - positioned absolutely -->
					<div
						class="black-key absolute top-0 z-10 cursor-pointer bg-gray-800 text-white transition-colors"
						class:active={activeKeys.includes(`${baseNote.toLowerCase()}#${octave}`)}
						class:h-20={!compact}
						class:h-14={compact}
						style="left: calc({offset} * {compact ? '1.4rem' : '1.8rem'} + {compact
							? '0.95rem'
							: '1.25rem'}); width: {compact ? '0.9rem' : '1.1rem'};"
						tabindex="0"
						on:mousedown={(e) => handleMouseDown(e, baseNote, '#', octave)}
						on:mouseup={(e) => handleMouseUp(e, baseNote, '#', octave)}
						on:mouseleave={(e) => handleMouseLeave(e, baseNote, '#', octave)}
						on:blur={() => !readonly && handleNotePress(baseNote, '#', octave, false)}
					>
						<!-- Note label shown based on showNotesLabels -->
						{#if showNotesLabels}
							<span class="absolute bottom-2 left-0 right-0 text-center text-[0.6rem] font-medium"
								>{sharpNote}{octave}</span
							>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	/* These styles are used with direct CSS properties */
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

	@media (max-width: 640px) {
		.white-key:not(.compact) {
			height: 7rem;
		}
	}
</style>
