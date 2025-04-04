import { browser } from '$app/environment';
import type { Signature } from '$lib/types/signatures';
import { signatures } from '$lib/types/signatures';
import { get, writable } from 'svelte/store';
import type { MidiNote } from './midi';

// Types
export interface SavedChord {
	id: string;
	notes: MidiNote[];
	signature: Signature;
	timestamp: number;
}

export interface ChordSet {
	id: string;
	name: string;
	chords: SavedChord[];
	timestamp: number;
}

export interface ChordTab {
	id: string;
	label: string;
	isActive: boolean;
}

// Stores
export const currentSignature = writable<Signature>(signatures[0]);
export const savedChords = writable<SavedChord[]>([]);
export const currentChordId = writable<string | null>(null);
export const playingChordId = writable<string | null>(null);

// Chord sets
export const chordSets = writable<ChordSet[]>([]);
export const editingSetId = writable<string | null>(null);

// Tabs
export const openTabs = writable<ChordTab[]>([]);
export const activeTabId = writable<string | null>(null);

// Load saved chords from localStorage
export function loadSavedChords() {
	if (!browser) return;

	try {
		const savedData = localStorage.getItem('pianoboi-saved-chords');

		if (savedData) {
			// Parse and reconstruct with proper Signature references
			const parsed = JSON.parse(savedData);
			const processedChords = parsed.map((chord: any) => {
				// Find the matching signature object by ID
				const matchedSignature =
					signatures.find((sig) => sig.id === chord.signature.id) || signatures[0];

				// Process notes to ensure they have proper format
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
									release: note._release || 0.5
								}
							: { ...note };

					// Ensure each note has the correct signature reference
					processedNote.signature = matchedSignature;
					return processedNote;
				});

				// Ensure all required fields are present
				return {
					...chord,
					notes: processedNotes,
					signature: matchedSignature,
					id: chord.id || `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					timestamp: chord.timestamp || Date.now()
				};
			});

			savedChords.set(processedChords);
			console.log('Loaded saved chords:', processedChords);
		}
	} catch (error) {
		console.error('Error loading saved chords:', error);
		// Start fresh if there was an error
		savedChords.set([]);
	}
}

// Save chords to localStorage
export function persistSavedChords() {
	if (!browser) return;

	try {
		localStorage.setItem('pianoboi-saved-chords', JSON.stringify(get(savedChords)));
		console.log('Saved chords to localStorage:', get(savedChords));
	} catch (error) {
		console.error('Error saving chords to localStorage:', error);
	}
}

// Function to save the current chord
export function saveCurrentChord(notes: MidiNote[]) {
	console.log('Attempting to save chord:', notes);

	// Don't save if no notes are active
	if (notes.length === 0) {
		console.log('No notes to save');
		return;
	}

	const id = `chord-${Date.now()}`;
	const signature = get(currentSignature);

	// Create new chord
	const newChord: SavedChord = {
		id,
		notes: [...notes],
		signature,
		timestamp: Date.now()
	};

	console.log('Creating new chord:', newChord);

	// Get current chord ID
	const insertAfter = get(currentChordId);

	// Update saved chords based on insertion point
	savedChords.update((chords) => {
		if (insertAfter === 'top') {
			return [newChord, ...chords];
		} else if (insertAfter) {
			const index = chords.findIndex((chord) => chord.id === insertAfter);
			if (index !== -1) {
				const updatedChords = [...chords];
				updatedChords.splice(index + 1, 0, newChord);
				return updatedChords;
			}
		}
		// No insertion point set, add to end
		return [...chords, newChord];
	});

	// Set the current chord ID to the new chord's ID
	currentChordId.set(id);

	// Persist saved chords
	persistSavedChords();

	return id;
}

// Function to set the current chord and update the insertion marker
export function setCurrentChord(id: string | null) {
	currentChordId.set(id);
}

// Delete a chord
export function deleteChord(id: string) {
	// If the chord being deleted is currently playing, stop it
	if (get(playingChordId) === id) {
		playingChordId.set(null);
	}

	// Remove the chord from the array
	savedChords.update((chords) => chords.filter((chord) => chord.id !== id));
	persistSavedChords();

	// Update current chord ID if needed
	if (get(currentChordId) === id) {
		const chords = get(savedChords);
		const chordIndex = chords.findIndex((chord) => chord.id === id);
		if (chordIndex > 0) {
			currentChordId.set(chords[chordIndex - 1].id);
		} else if (chords.length > 0) {
			currentChordId.set('top');
		} else {
			currentChordId.set(null);
		}
	}
}

// Load chord sets from localStorage
export function loadChordSets() {
	if (!browser) return;

	try {
		const savedData = localStorage.getItem('pianoboi-chord-sets');
		console.log('Loading chord sets from localStorage:', savedData);

		if (savedData) {
			// Parse and reconstruct with proper Signature references
			const parsed = JSON.parse(savedData);
			const processedSets = parsed.map((set: any) => {
				// Process chords in the set
				const processedChords = set.chords.map((chord: any) => {
					// Find the matching signature object by ID
					const matchedSignature =
						signatures.find((sig) => sig.id === chord.signature.id) || signatures[0];

					// Process notes to ensure they have proper format
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
										release: note._release || 0.5
									}
								: { ...note };

						// Ensure each note has the correct signature reference
						processedNote.signature = matchedSignature;
						return processedNote;
					});

					// Return processed chord
					return {
						...chord,
						notes: processedNotes,
						signature: matchedSignature,
						id: chord.id || `chord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						timestamp: chord.timestamp || Date.now()
					};
				});

				// Return processed set
				return {
					...set,
					chords: processedChords,
					id: set.id || `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
					name: set.name || `New Set ${parsed.length + 1}`,
					timestamp: set.timestamp || Date.now()
				};
			});

			chordSets.set(processedSets);
			console.log('Loaded chord sets:', processedSets);
		}
	} catch (error) {
		console.error('Error loading chord sets:', error);
		// Start fresh if there was an error
		chordSets.set([]);
	}
}

// Save chord sets to localStorage
export function persistChordSets() {
	if (!browser) return;

	try {
		localStorage.setItem('pianoboi-chord-sets', JSON.stringify(get(chordSets)));
		console.log('Saved chord sets to localStorage:', get(chordSets));
	} catch (error) {
		console.error('Error saving chord sets to localStorage:', error);
	}
}

// Create a new chord set
export function createChordSet() {
	// Generate a unique name
	const sets = get(chordSets);
	const existingNames = sets.map((set) => set.name);
	let counter = 1;
	let name = `New Set ${counter}`;

	while (existingNames.includes(name)) {
		counter++;
		name = `New Set ${counter}`;
	}

	const newSet: ChordSet = {
		id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name,
		chords: [],
		timestamp: Date.now()
	};

	chordSets.update((sets) => [...sets, newSet]);
	persistChordSets();

	// Start editing the new set name
	editingSetId.set(newSet.id);

	return newSet.id;
}

// Delete a chord set
export function deleteChordSet(id: string) {
	// Remove set
	chordSets.update((sets) => sets.filter((set) => set.id !== id));
	persistChordSets();

	// Close tab if open
	if (get(openTabs).some((tab) => tab.id === id)) {
		closeTab(id);
	}
}

// Update chord set name
export function updateChordSetName(id: string, newName: string) {
	chordSets.update((sets) => sets.map((set) => (set.id === id ? { ...set, name: newName } : set)));

	// Update tab label if open
	openTabs.update((tabs) => tabs.map((tab) => (tab.id === id ? { ...tab, label: newName } : tab)));

	persistChordSets();
	editingSetId.set(null);
}

// Toggle edit mode for a chord set
export function toggleEditSet(id: string) {
	editingSetId.update((current) => (current === id ? null : id));
}

// Open a chord set in a tab
export function openSetInTab(id: string) {
	const sets = get(chordSets);
	const setToOpen = sets.find((set) => set.id === id);
	if (!setToOpen) return;

	const tabs = get(openTabs);

	// Check if already open
	if (tabs.some((tab) => tab.id === id)) {
		// Just make it active
		setActiveTab(id);
		return;
	}

	// Save current chords as a set if needed
	const chords = get(savedChords);
	if (chords.length > 0 && !tabs.some((tab) => tab.id === 'current')) {
		// Current chords aren't in a tab yet, create a tab
		openTabs.update((tabs) => [
			...tabs,
			{ id: 'current', label: 'Current Progression', isActive: false }
		]);
	}

	// Add new tab
	openTabs.update((tabs) => [
		...tabs,
		{ id: setToOpen.id, label: setToOpen.name, isActive: false }
	]);

	// Set as active
	setActiveTab(id);
}

// Set active tab
export function setActiveTab(id: string) {
	openTabs.update((tabs) =>
		tabs.map((tab) => ({
			...tab,
			isActive: tab.id === id
		}))
	);

	activeTabId.set(id);

	// If switching to current chords, nothing more to do
	if (id === 'current') return;

	// Otherwise, load the set's chords as savedChords
	const sets = get(chordSets);
	const selectedSet = sets.find((set) => set.id === id);
	if (selectedSet) {
		savedChords.set([...selectedSet.chords]);
	}
}

// Close a tab
export function closeTab(id: string) {
	// Remove tab
	openTabs.update((tabs) => tabs.filter((tab) => tab.id !== id));

	// If this was the active tab, activate another one
	if (get(activeTabId) === id) {
		const tabs = get(openTabs);
		if (tabs.length > 0) {
			setActiveTab(tabs[0].id);
		} else {
			activeTabId.set(null);
			savedChords.set([]); // Clear if no tabs left
		}
	}
}

// Add current chords to a set
export function addCurrentChordsToSet(setId: string) {
	const chords = get(savedChords);
	if (chords.length === 0) return;

	// Find the set
	chordSets.update((sets) => {
		const setIndex = sets.findIndex((set) => set.id === setId);
		if (setIndex === -1) return sets;

		// Add chords to the set
		const updatedSet = {
			...sets[setIndex],
			chords: [...sets[setIndex].chords, ...chords]
		};

		// Update the set
		const newSets = [...sets];
		newSets[setIndex] = updatedSet;
		return newSets;
	});

	persistChordSets();
}

// Save current chord progression as a new set
export function saveCurrentProgressionAsSet() {
	const chords = get(savedChords);
	if (chords.length === 0) return null;

	// Generate a unique name
	const sets = get(chordSets);
	const existingNames = sets.map((set) => set.name);
	let counter = 1;
	let name = `New Set ${counter}`;

	while (existingNames.includes(name)) {
		counter++;
		name = `New Set ${counter}`;
	}

	// Create new set
	const newSet: ChordSet = {
		id: `set-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		name,
		chords: [...chords],
		timestamp: Date.now()
	};

	chordSets.update((sets) => [...sets, newSet]);
	persistChordSets();

	// Open in a new tab
	openSetInTab(newSet.id);

	return newSet.id;
}

// Delete a chord from a set
export function deleteChordFromSet(params: { setId: string; chordId: string }) {
	const { setId, chordId } = params;

	// Update the set
	chordSets.update((sets) => {
		const setIndex = sets.findIndex((set) => set.id === setId);
		if (setIndex === -1) return sets;

		// Remove chord from the set
		const updatedSet = {
			...sets[setIndex],
			chords: sets[setIndex].chords.filter((chord) => chord.id !== chordId)
		};

		// Update the set in the array
		const newSets = [...sets];
		newSets[setIndex] = updatedSet;
		return newSets;
	});

	persistChordSets();

	// If this set is currently open in a tab, update the displayed chords
	if (get(activeTabId) === setId) {
		const sets = get(chordSets);
		const updatedSet = sets.find((set) => set.id === setId);
		if (updatedSet) {
			savedChords.set([...updatedSet.chords]);
		}
	}
}

// Helper function to calculate MIDI note number
function calculateNoteNumber(noteName: string, accidental: string, octave: number): number {
	const noteValues: Record<string, number> = {
		C: 0,
		'C#': 1,
		D: 2,
		'D#': 3,
		E: 4,
		F: 5,
		'F#': 6,
		G: 7,
		'G#': 8,
		A: 9,
		'A#': 10,
		B: 11,
		Db: 1,
		Eb: 3,
		Gb: 6,
		Ab: 8,
		Bb: 10
	};

	const normalizedName = noteName.toUpperCase() + accidental;
	const noteValue = noteValues[normalizedName] || 0;
	return (octave + 1) * 12 + noteValue;
}
