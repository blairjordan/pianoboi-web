<script lang="ts">
	import type { Signature } from '$lib/types/signatures';
	import { Key } from '@tonaljs/tonal';
	import { afterUpdate, onMount } from 'svelte';
	import {
		Accidental,
		Formatter,
		Renderer,
		Stave,
		StaveConnector,
		StaveNote,
		Voice
	} from 'vexflow';
	import type { Note } from 'webmidi';

	export let notes: Note[] = [];
	export let signature: Signature;

	let container: HTMLDivElement;
	let renderer: Renderer;
	let context: any;

	// Helper function to safely access note properties regardless of the note format
	function getNoteProperty(note: any, prop: string, defaultValue: any = '') {
		// Handle both standard note objects and WebMidi note objects
		try {
			// For standard notes
			if (note[prop] !== undefined) {
				return note[prop];
			}
			// For WebMidi notes with underscore prefix
			if (note[`_${prop}`] !== undefined) {
				return note[`_${prop}`];
			}
			// Fallback
			return defaultValue;
		} catch (err) {
			console.error(`Error accessing ${prop} of note:`, note, err);
			return defaultValue;
		}
	}
	
	// Helper to safely get the note name letter
	function getNoteLetter(note: any): string {
		const name = getNoteProperty(note, 'name', 'C');
		if (typeof name === 'string' && name.length > 0) {
			return name[0].toLowerCase();
		}
		return 'c';
	}

	onMount(() => {
		initRenderer();
		renderMusic();
	});

	afterUpdate(() => {
		console.log('SheetMusic updated with notes:', notes);
		renderMusic();
	});

	function initRenderer() {
		if (!container) return;

		// Clear any previous content
		container.innerHTML = '';

		// Create VexFlow renderer
		renderer = new Renderer(container, Renderer.Backends.SVG);
		renderer.resize(container.clientWidth, 200); // Reduce height for more compact display
		context = renderer.getContext();
		context.setFont('Arial', 10);
	}

	// Get all notes affected by the key signature (e.g., F# in G major)
	function getKeySignatureAlterations(sigId: string): Map<string, string> {
		try {
			// Get actual notes with alterations from the key
			const key = Key.majorKey(sigId);
			console.log('Key info for', sigId, ':', key);

			// Map to store note names and their accidentals in this key
			const alterations = new Map<string, string>();

			// Check if we have a flat key signature
			const isFlat = sigId.includes('b') || key.alteration < 0;

			// Process each note in the scale to find accidentals
			for (const note of key.scale) {
				// Extract the note name (letter) and accidental
				const noteLetter = note[0]; // First character is the note letter (C, D, etc.)
				const hasAccidental = note.includes('#') || note.includes('b');
				const accidental = hasAccidental ? note[1] : '';

				// Store the accidental for this note letter
				if (hasAccidental) {
					alterations.set(noteLetter.toLowerCase(), accidental);
				}
			}

			console.log('Key alterations for', sigId, ':', Object.fromEntries(alterations));
			console.log('Is flat key:', isFlat);
			return alterations;
		} catch (error) {
			console.error('Error getting key alterations:', error);
			return new Map();
		}
	}

	// Create a chord note when multiple notes are played
	function createChordNote(clef: 'treble' | 'bass', noteGroup: Note[]) {
		if (noteGroup.length === 0) return null;

		console.log('Creating chord note with:', noteGroup);

		try {
			// Get key signature alterations
			const keyAlterations = getKeySignatureAlterations(signature.id);

			// Check if we're in a flat key
			const isFlat = signature.id.includes('b') || signature.flats > 0;
			console.log('Key signature:', signature.id, 'Is flat key:', isFlat);

			// Prepare enharmonic mappings
			// Sharp to flat: C# -> Db, D# -> Eb, etc.
			const sharpToFlatMap: Record<string, { note: string; accidental: string }> = {
				'C#': { note: 'D', accidental: 'b' },
				'D#': { note: 'E', accidental: 'b' },
				'F#': { note: 'G', accidental: 'b' },
				'G#': { note: 'A', accidental: 'b' },
				'A#': { note: 'B', accidental: 'b' }
			};

			// Flat to sharp: Db -> C#, Eb -> D#, etc.
			const flatToSharpMap: Record<string, { note: string; accidental: string }> = {
				Db: { note: 'C', accidental: '#' },
				Eb: { note: 'D', accidental: '#' },
				Gb: { note: 'F', accidental: '#' },
				Ab: { note: 'G', accidental: '#' },
				Bb: { note: 'A', accidental: '#' }
			};

			// First, convert all notes to proper enharmonic equivalents for the key signature
			const normalizedNotes = noteGroup.map((note) => {
				// Create a deep copy to avoid modifying the original
				const result = {
					name: getNoteProperty(note, 'name', 'C'),
					accidental: getNoteProperty(note, 'accidental', ''),
					octave: getNoteProperty(note, 'octave', 4),
					number: getNoteProperty(note, 'number', 60)
				};

				// Handle enharmonic conversion based on key signature
				if (isFlat && result.accidental === '#') {
					// In flat keys, convert sharps to flats
					const originalNoteName = result.name + result.accidental;

					if (originalNoteName in sharpToFlatMap) {
						const enharmonic = sharpToFlatMap[originalNoteName];
						result.name = enharmonic.note;
						result.accidental = enharmonic.accidental;
						console.log(
							`Normalized: ${originalNoteName} -> ${result.name}${result.accidental} in flat key`
						);
					}
				} else if (!isFlat && result.accidental === 'b') {
					// In sharp keys, convert flats to sharps
					const originalNoteName = result.name + result.accidental;

					if (originalNoteName in flatToSharpMap) {
						const enharmonic = flatToSharpMap[originalNoteName];
						result.name = enharmonic.note;
						result.accidental = enharmonic.accidental;
						console.log(
							`Normalized: ${originalNoteName} -> ${result.name}${result.accidental} in sharp key`
						);
					}
				}

				return result;
			});

			console.log('Normalized notes for key signature:', normalizedNotes);

			// Format notes for VexFlow chord
			const keyStrings = normalizedNotes.map((note, index) => {
				try {
					// Extract the basic note name (without accidental)
					const noteName = note.name[0].toLowerCase();

					// Get accidental
					const accidental = note.accidental || '';

					// Get octave as a string
					const octave = note.octave.toString();

					// Format as expected by VexFlow (e.g., "c/4", "d#/5")
					const keyString = `${noteName}${accidental}/${octave}`;
					console.log(
						`Note ${index}: ${note.name}${note.accidental || ''}${note.octave} → VexFlow format: ${keyString}`
					);
					return keyString;
				} catch (err) {
					console.error(`Error formatting note ${index}:`, note, err);
					// Provide a fallback key string based on clef
					return clef === 'treble' ? 'c/4' : 'c/3';
				}
			});

			console.log('Final VexFlow key strings:', keyStrings);

			// Create chord
			const staveNote = new StaveNote({
				keys: keyStrings,
				duration: 'w', // Whole note
				clef: clef
			});

			// Add accidentals to each note in the chord - considering key signature
			normalizedNotes.forEach((note, i) => {
				try {
					const noteLetter = note.name[0].toLowerCase(); // Get the note letter (c, d, etc.)
					const playedAccidental = note.accidental || '';

					// Get the expected accidental from the key signature
					const keyAccidental = keyAlterations.get(noteLetter) || '';

					console.log(
						`Note ${note.name}: key sig expects ${keyAccidental}, played with ${playedAccidental}`
					);

					// Case 1: Key signature has no accidental for this note, but we're playing with one
					if (!keyAccidental && playedAccidental) {
						console.log(`Adding ${playedAccidental} to ${noteLetter}`);
						staveNote.addModifier(new Accidental(playedAccidental), i);
					}
					// Case 2: Key signature has an accidental, but we're playing natural
					else if (keyAccidental && !playedAccidental) {
						console.log(`Adding natural to ${noteLetter} (would be ${keyAccidental} in key)`);
						staveNote.addModifier(new Accidental('n'), i);
					}
					// Case 3: Key signature has an accidental, and we're playing with a different accidental
					else if (keyAccidental && playedAccidental && keyAccidental !== playedAccidental) {
						console.log(
							`Adding ${playedAccidental} to ${noteLetter} (overriding ${keyAccidental} from key)`
						);
						staveNote.addModifier(new Accidental(playedAccidental), i);
					}
					// Case 4: Note follows key signature - no accidental needed
					else if (keyAccidental && playedAccidental && keyAccidental === playedAccidental) {
						console.log(
							`No accidental needed for ${note.name}${playedAccidental} (covered by key signature)`
						);
					}
				} catch (err) {
					console.error(`Error adding accidental for note ${i}:`, note, err);
				}
			});

			return staveNote;
		} catch (error) {
			console.error('Error creating chord note:', error);
			// Return null on error so calling code can handle it
			return null;
		}
	}

	// Create a whole rest for empty measures
	function createWholeRest(clef: 'treble' | 'bass') {
		// Default rest position based on clef
		const restPosition = clef === 'treble' ? 'b/4' : 'd/3';
		console.log(`Creating whole rest in ${clef} clef at position ${restPosition}`);
		return new StaveNote({
			clef,
			keys: [restPosition],
			duration: 'wr' // whole rest
		});
	}

	function renderMusic() {
		if (!container || !renderer || !context) {
			console.log('Container, renderer or context not ready');
			return;
		}

		try {
			// Clear the canvas
			context.clear();

			// Get width of container for responsive sizing
			const width = container.clientWidth;

			// Calculate better dimensions with margins
			const margin = 40; // Increase left margin
			const staveWidth = Math.min(width - margin * 2, 350); // Slightly narrower staff

			// Vertical spacing
			const topMargin = 15;
			const stavesSpacing = 70; // Reduce space between staves

			// Create the staves with better positioning
			const trebleStave = new Stave(margin, topMargin, staveWidth);
			const bassStave = new Stave(margin, topMargin + stavesSpacing, staveWidth);

			// Configure the staves
			trebleStave.addClef('treble');
			trebleStave.addKeySignature(signature.id);

			bassStave.addClef('bass');
			bassStave.addKeySignature(signature.id);

			// Draw the staves
			trebleStave.setContext(context).draw();
			bassStave.setContext(context).draw();

			// Add a connector line between the staves
			const connector = new StaveConnector(trebleStave, bassStave);
			connector.setType(StaveConnector.type.BRACE);
			connector.setContext(context).draw();

			// Sort notes by pitch
			const sortedNotes = [...notes].sort((a, b) => {
				const aNum = getNoteProperty(a, 'number', 0);
				const bNum = getNoteProperty(b, 'number', 0);
				return aNum - bNum;
			});
			console.log('Sorted notes for rendering:', sortedNotes);

			// Ensure notes have all required properties
			const validNotes = sortedNotes.filter((note) => {
				const hasRequiredProps = 
					!!getNoteProperty(note, 'name') && 
					getNoteProperty(note, 'octave') !== undefined;
				
				if (!hasRequiredProps) {
					console.warn('Invalid note found:', note);
				}
				return hasRequiredProps;
			});

			// Group notes by clef
			const trebleNotes = validNotes.filter((note) => {
				const octave = getNoteProperty(note, 'octave', 0);
				return octave >= 4;
			});
			
			const bassNotes = validNotes.filter((note) => {
				const octave = getNoteProperty(note, 'octave', 0);
				return octave < 4;
			});
			
			console.log('Treble notes:', trebleNotes, 'Bass notes:', bassNotes);

			// Create the notes/rests for each stave
			let trebleVoiceNotes = [];
			let bassVoiceNotes = [];

			// If we have notes, create chord notes, otherwise use whole rests
			if (trebleNotes.length > 0) {
				const trebleChord = createChordNote('treble', trebleNotes);
				if (trebleChord) trebleVoiceNotes.push(trebleChord);
				else trebleVoiceNotes.push(createWholeRest('treble'));
			} else {
				trebleVoiceNotes.push(createWholeRest('treble'));
			}

			if (bassNotes.length > 0) {
				const bassChord = createChordNote('bass', bassNotes);
				if (bassChord) bassVoiceNotes.push(bassChord);
				else bassVoiceNotes.push(createWholeRest('bass'));
			} else {
				bassVoiceNotes.push(createWholeRest('bass'));
			}

			console.log('Treble voice notes:', trebleVoiceNotes, 'Bass voice notes:', bassVoiceNotes);

			// Create and draw the treble voice - fix the time signature to match our single whole note/rest
			const trebleVoice = new Voice({
				numBeats: 1, // We're only using one whole note/rest
				beatValue: 1 // Whole note value
			});
			trebleVoice.addTickables(trebleVoiceNotes);

			new Formatter().joinVoices([trebleVoice]).format([trebleVoice], staveWidth - 60);

			trebleVoice.draw(context, trebleStave);

			// Create and draw the bass voice - fix the time signature to match our single whole note/rest
			const bassVoice = new Voice({
				numBeats: 1, // We're only using one whole note/rest
				beatValue: 1 // Whole note value
			});
			bassVoice.addTickables(bassVoiceNotes);

			new Formatter().joinVoices([bassVoice]).format([bassVoice], staveWidth - 60);

			bassVoice.draw(context, bassStave);
		} catch (error) {
			console.error('Error rendering music:', error);
		}
	}
</script>

<div class="sheet-music w-full min-h-[200px] bg-white rounded-md overflow-hidden" bind:this={container}></div>
