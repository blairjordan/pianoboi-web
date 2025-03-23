<script lang="ts">
	import type { Signature } from '$lib/types/signatures';
	import { Chord, Key } from '@tonaljs/tonal';
	import type { Note } from 'webmidi';

	export let notes: Note[] = [];
	export let signature: Signature;
	export let debug = false; // Add debug prop to show note information

	$: majorChords = Key.majorKey(signature.id).chords;
	$: minorChords = Key.minorKey(signature.id.toLowerCase()).natural.chords;

	// Helper function to safely get a property from a note (handles WebMidi note objects)
	function getNoteProperty(note: any, prop: string, defaultValue: any = '') {
		try {
			if (note[prop] !== undefined) {
				return note[prop];
			}
			if (note[`_${prop}`] !== undefined) {
				return note[`_${prop}`];
			}
			return defaultValue;
		} catch (err) {
			console.error(`Error accessing ${prop} of note:`, note);
			return defaultValue;
		}
	}

	// Convert notes to unique pitch classes (removes duplicate notes regardless of octave)
	$: pitchClasses = Array.from(
		new Set(
			notes.map((note) => {
				const name = getNoteProperty(note, 'name', '');
				const accidental = getNoteProperty(note, 'accidental', '');
				return name + (accidental || '');
			})
		)
	);

	// Debug log when pitch classes change
	$: {
		if (pitchClasses.length > 0) {
			console.log('Current pitch classes for chord detection:', pitchClasses);
		}
	}

	// Calculate possible chords based on pitch classes
	$: currentChords = Chord.detect(pitchClasses);

	// Log chords that were detected
	$: {
		if (currentChords.length > 0) {
			console.log('Detected chords:', currentChords);
		}
	}

	// Find if a chord is in the current key
	function isInKey(chord: string): boolean {
		return majorChords.includes(chord) || minorChords.includes(chord);
	}
</script>

<div class="mt-6 w-full">
	<div class="rounded-lg bg-gray-50 p-4">
		<h3 class="mb-2 text-lg font-semibold text-gray-800">Chord Detection</h3>

		{#if debug && notes.length > 0}
			<div class="mb-3 text-xs text-gray-500">
				<p>Pitch classes: {pitchClasses.join(', ')}</p>
				<p>Original notes: {notes.map(n => getNoteProperty(n, 'name') + getNoteProperty(n, 'accidental', '') + getNoteProperty(n, 'octave')).join(', ')}</p>
			</div>
		{/if}

		{#if notes.length === 0}
			<p class="text-gray-500">Play notes to detect chords</p>
		{:else if currentChords.length === 0}
			<p class="text-gray-500">No recognized chord</p>
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
</div>
