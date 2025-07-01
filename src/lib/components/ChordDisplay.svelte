<script lang="ts">
	import type { Signature } from '$lib/types/signatures';
	import { Key } from '@tonaljs/tonal';
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

	// Find if a chord is in the current key
	function isInKey(chord: string): boolean {
		return majorChords.includes(chord) || minorChords.includes(chord);
	}
</script>

<div class="rounded-lg border bg-white p-2 shadow-sm">
	<div class="text-xs">
		<div class="mb-1 flex items-center justify-between">
			<h3 class="font-medium text-gray-700">Current Notes</h3>
			{#if debug}
				<span class="text-xs text-gray-500">{pitchClasses.join(', ')}</span>
			{/if}
		</div>
		
		{#if notes.length > 0}
			<div class="mt-1 flex flex-wrap gap-1">
				{#each pitchClasses as note}
					<span class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
						{note}
					</span>
				{/each}
			</div>
		{:else}
			<p class="mt-1 leading-5 text-xs text-gray-500">No notes detected. Play some notes to see them here.</p>
		{/if}
	</div>
</div>
