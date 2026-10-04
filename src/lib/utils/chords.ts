// Chord utilities for PianoBoi
import type { Signature } from '../types/signatures';
import { signatures } from '../types/signatures';
import { Chord } from '@tonaljs/tonal';
import { calculateNoteNumber } from './audio';

export interface SavedChord {
	id: string; // Unique identifier
	notes: any[]; // The notes in the chord
	signature: Signature; // Key signature at the time of save
	timestamp: number; // When it was saved
	setId: string | null; // Reference to the set this chord belongs to, can be null
}

export interface ChordSet {
	id: string; // Unique identifier
	name: string; // User-defined name for the set
	timestamp: number; // When it was created
	description?: string; // Optional description
}

export interface MatchingChords {
	majorMatches: number[];
	minorMatches: number[];
}

export const SAVED_CHORDS_STORAGE_KEY = 'pianoboi-saved-chords';
export const CHORD_SETS_STORAGE_KEY = 'pianoboi-chord-sets';
export const CHORDS_CHANGE_EVENT = 'pianoboi:chords-change';

/**
 * Load saved chords and sets from localStorage
 */
export function loadSavedChords(): { savedChords: SavedChord[]; chordSets: ChordSet[] } {
	const savedChords: SavedChord[] = [];
	const chordSets: ChordSet[] = [];

	try {
		if (typeof window === 'undefined') return { savedChords, chordSets };

		const savedChordsData = localStorage.getItem(SAVED_CHORDS_STORAGE_KEY);
		const savedSetsData = localStorage.getItem(CHORD_SETS_STORAGE_KEY);

		if (savedSetsData) {
			const parsedSets = JSON.parse(savedSetsData);
			chordSets.push(...parsedSets);
		}

		if (savedChordsData) {
			// Need to reconstruct saved chords with proper Signature object references
			const parsed = JSON.parse(savedChordsData);
			const processedChords = parsed.map((chord: any) => {
				// Find the matching signature object by ID
				const matchedSignature =
					signatures.find((sig) => sig.id === chord.signature.id) || signatures[0];

				// Process notes to ensure they have proper format and signature
				const processedNotes = chord.notes.map((note: any) => {
					// Convert _name to name if needed (for MIDI notes)
					const processedNote =
						note._name && !note.name
							? {
									name: note._name,
									accidental: note._accidental || '',
									octave: note._octave,
									number: calculateNoteNumber(note._name, note._accidental || '', note._octave),
									identifier: `${note._name}${note._accidental || ''}${note._octave}`,
									attack: note._attack || 0.5,
									release: note._release || 0.5,
									signature: matchedSignature
								}
							: { ...note };

					// Ensure each note has the correct signature reference
					processedNote.signature = matchedSignature;
					return processedNote;
				});

				// Ensure all required fields are present and preserve setId if it exists
				return {
					...chord,
					notes: processedNotes,
					signature: matchedSignature,
					id: chord.id || `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					timestamp: chord.timestamp || Date.now(),
					setId: chord.setId || null
				};
			});

			savedChords.push(...processedChords);
		}
	} catch (error) {
		console.error('Error loading saved chords:', error);
		// Start fresh if there was an error
	}

	return { savedChords, chordSets };
}

/**
 * Save chords and sets to localStorage
 */
export function persistSavedChords(savedChords: SavedChord[], chordSets: ChordSet[]): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(SAVED_CHORDS_STORAGE_KEY, JSON.stringify(savedChords));
		localStorage.setItem(CHORD_SETS_STORAGE_KEY, JSON.stringify(chordSets));
		window.dispatchEvent(new CustomEvent(CHORDS_CHANGE_EVENT));
	} catch (error) {
		console.error('Error saving to localStorage:', error);
	}
}

/**
 * Create a new chord set
 */
export function createChordSet(
	name: string,
	existingSets: ChordSet[]
): { newSet: ChordSet; updatedSets: ChordSet[] } {
	if (!name.trim()) {
		return { newSet: null as unknown as ChordSet, updatedSets: existingSets };
	}

	const setId = `set-${Date.now()}`;
	const newSet: ChordSet = {
		id: setId,
		name: name.trim(),
		timestamp: Date.now(),
		description: ''
	};

	const updatedSets = [...existingSets, newSet];
	return { newSet, updatedSets };
}

/**
 * Delete a chord set
 */
export function deleteChordSet(
	setId: string,
	chordSets: ChordSet[],
	savedChords: SavedChord[],
	currentSetId: string | null
): {
	updatedSets: ChordSet[];
	updatedChords: SavedChord[];
	newCurrentSetId: string | null;
} {
	// Remove the set
	const updatedSets = chordSets.filter((set) => set.id !== setId);

	// Keep chords but remove their set association
	const updatedChords = savedChords.map((chord) =>
		chord.setId === setId ? { ...chord, setId: null } : chord
	);

	// If the deleted set was the current set, reset current set
	let newCurrentSetId = currentSetId;
	if (currentSetId === setId) {
		newCurrentSetId = updatedSets.length > 0 ? updatedSets[0].id : null;
	}

	return { updatedSets, updatedChords, newCurrentSetId };
}

/**
 * Assign a chord to a specific set
 */
export function assignChordToSet(
	chordId: string,
	setId: string | null,
	savedChords: SavedChord[]
): SavedChord[] {
	return savedChords.map((chord) => (chord.id === chordId ? { ...chord, setId } : chord));
}

/**
 * Helper function to safely get note properties
 */
export function getNoteProperty(note: any, prop: string, defaultValue: any = ''): any {
	try {
		if (note[prop] !== undefined) {
			return note[prop];
		}
		if (note[`_${prop}`] !== undefined) {
			return note[`_${prop}`];
		}
		return defaultValue;
	} catch {
		console.error(`Error accessing ${prop} of note:`, note);
		return defaultValue;
	}
}

/**
 * Extract pitch classes from notes
 */
export function extractPitchClasses(notes: any[]): string[] {
	return Array.from(
		new Set(
			notes.map((note) => {
				const name = getNoteProperty(note, 'name', '');
				const accidental = getNoteProperty(note, 'accidental', '');
				return name + (accidental || '');
			})
		)
	);
}

/**
 * Generate the scale degree chords for a given key
 */
export function generateScaleChords(signature: Signature) {
	const noteValues: { [key: string]: number } = {
		C: 0,
		'C#': 1,
		Db: 1,
		D: 2,
		'D#': 3,
		Eb: 3,
		E: 4,
		F: 5,
		'F#': 6,
		Gb: 6,
		G: 7,
		'G#': 8,
		Ab: 8,
		A: 9,
		'A#': 10,
		Bb: 10,
		B: 11,
		Cb: 11
	};

	// Get the key's value
	const keyValue = noteValues[signature.major];

	// For major scale: I, ii, iii, IV, V, vi, vii°
	// For minor scale: i, ii°, III, iv, v, VI, VII

	// Major scale pattern in semitones
	const majorPattern = [0, 2, 4, 5, 7, 9, 11];

	// Generate actual notes for the scale
	const scaleNotes = majorPattern.map((interval) => {
		const noteValue = (keyValue + interval) % 12;
		// Convert back to note name - simplified version
		const noteIndex = Object.keys(noteValues).findIndex(
			(note) => noteValues[note] === noteValue && !note.includes('b')
		);
		return Object.keys(noteValues)[noteIndex];
	});

	// Chord types for major scale
	const majorChordTypes = ['', 'm', 'm', '', '', 'm', 'dim'];
	const majorChords = scaleNotes.map((note, i) => `${note}${majorChordTypes[i]}`);

	// Minor key is relative minor of the major (6th degree)
	const minorRootValue = noteValues[signature.minor];

	// Minor scale pattern in semitones (natural minor)
	const minorPattern = [0, 2, 3, 5, 7, 8, 10];

	// Generate actual notes for the minor scale
	const minorScaleNotes = minorPattern.map((interval) => {
		const noteValue = (minorRootValue + interval) % 12;
		// Convert back to note name - simplified version
		const noteIndex = Object.keys(noteValues).findIndex(
			(note) => noteValues[note] === noteValue && !note.includes('b')
		);
		return Object.keys(noteValues)[noteIndex];
	});

	// Chord types for minor scale
	const minorChordTypes = ['m', 'dim', '', 'm', 'm', '', ''];
	const minorChords = minorScaleNotes.map((note, i) => `${note}${minorChordTypes[i]}`);

	return {
		major: majorChords,
		minor: minorChords
	};
}

/**
 * Find matching chords in the scale using tonal.js
 */
export function findMatchingChords(
	notes: any[],
	scaleChords: { major: string[]; minor: string[] }
): MatchingChords {
	const majorMatches: number[] = [];
	const minorMatches: number[] = [];

	if (!notes || notes.length === 0) return { majorMatches, minorMatches };

	// Extract pitch classes (unique note names without octave)
	const pitchClasses = extractPitchClasses(notes);

	// Get detected chords using tonal.js
	const detectedChords = Chord.detect(pitchClasses);
	console.log('Chord.detect results for scale matching:', detectedChords);

	// Match with scale chords
	scaleChords.major.forEach((chord, index) => {
		// Check if any detected chord matches this scale chord position
		const matchesPosition = detectedChords.some((detected: string) => {
			// Extract root and type for comparison
			const match = detected.match(/^([A-G][#b]?)(.*)$/);
			if (!match) return false;
			const detectedRoot = match[1];

			const chordMatch = chord.match(/^([A-G][#b]?)(.*)$/);
			if (!chordMatch) return false;
			const chordRoot = chordMatch[1];

			// Check if the roots match (ignoring octave, considering enharmonic equivalents)
			return detectedRoot.toUpperCase() === chordRoot.toUpperCase();
		});

		if (matchesPosition) {
			majorMatches.push(index);
		}
	});

	// Check minor scale chords with the same approach
	scaleChords.minor.forEach((chord, index) => {
		const matchesPosition = detectedChords.some((detected: string) => {
			const match = detected.match(/^([A-G][#b]?)(.*)$/);
			if (!match) return false;
			const detectedRoot = match[1];

			const chordMatch = chord.match(/^([A-G][#b]?)(.*)$/);
			if (!chordMatch) return false;
			const chordRoot = chordMatch[1];

			return detectedRoot.toUpperCase() === chordRoot.toUpperCase();
		});

		if (matchesPosition) {
			minorMatches.push(index);
		}
	});

	return { majorMatches, minorMatches };
}

/**
 * Check if a chord is in the current key
 */
export function isInKey(chord: string, scaleChords: { major: string[]; minor: string[] }): boolean {
	const majorChords = scaleChords.major;
	const minorChords = scaleChords.minor;
	return majorChords.includes(chord) || minorChords.includes(chord);
}
