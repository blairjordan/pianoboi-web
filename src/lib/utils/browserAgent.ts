import type { PianoNote } from '../types/notes';
import { signatures } from '../types/signatures';
import {
	CHORD_SETS_STORAGE_KEY,
	loadSavedChords,
	persistSavedChords,
	SAVED_CHORDS_STORAGE_KEY,
	type ChordSet,
	type SavedChord
} from './chords';
import { calculateNoteNumber } from './audio';
import {
	createScratchpadApi,
	SCRATCHPAD_STORAGE_KEY,
	type PianoBoiScratchpadApi
} from './scratchpad';

export const AGENT_INSTRUCTIONS_TEXT = `Pianoboi browser agent API

Run these commands in the page's JavaScript context. Prefer this API over raw localStorage because it validates notes and updates the visible app immediately.

const app = window.pianoboiAgent;

// Read all chords
const chords = app.chords.list();

// Store a chord (note names include octaves)
const chord = app.chords.add({
  notes: ['C4', 'E4', 'G4'],
  signatureId: 'C',
  setId: null
});

// Modify, move, or remove a chord
app.chords.update(chord.id, { notes: ['D4', 'F#4', 'A4'], signatureId: 'D' });
app.chords.move(chord.id, 0);
app.chords.remove(chord.id);

// Optional chord sets
const verse = app.sets.add('Verse');
app.chords.add({ notes: ['C4', 'E4', 'G4'], signatureId: 'C', setId: verse.id });

// Live scratchpad Markdown and piano components
app.scratchpad.set('# Verse\\nPlay <Chord name="C"><Keys>C4 E4 G4</Keys></Chord>');
app.scratchpad.append('Then play <Key>F4</Key>.');
app.scratchpad.clear();

Storage keys are available at app.storageKeys. Direct localStorage writes are also detected, but the API is immediate.`;

export type AgentNoteInput = string | Partial<PianoNote>;

export interface AgentChordInput {
	id?: string;
	notes: AgentNoteInput[];
	signatureId?: string;
	setId?: string | null;
	timestamp?: number;
}

export interface AgentChordPatch {
	notes?: AgentNoteInput[];
	signatureId?: string;
	setId?: string | null;
}

export interface PianoBoiAgentApi {
	readonly storageKeys: {
		readonly chords: typeof SAVED_CHORDS_STORAGE_KEY;
		readonly sets: typeof CHORD_SETS_STORAGE_KEY;
		readonly scratchpad: typeof SCRATCHPAD_STORAGE_KEY;
	};
	readonly scratchpad: PianoBoiScratchpadApi;
	readonly chords: {
		list: () => SavedChord[];
		add: (input: AgentChordInput) => SavedChord;
		update: (id: string, patch: AgentChordPatch) => SavedChord;
		move: (id: string, index: number) => SavedChord[];
		remove: (id: string) => boolean;
		replaceAll: (inputs: AgentChordInput[]) => SavedChord[];
	};
	readonly sets: {
		list: () => ChordSet[];
		add: (name: string, description?: string) => ChordSet;
		update: (id: string, patch: { name?: string; description?: string }) => ChordSet;
		remove: (id: string) => boolean;
	};
	help: () => string;
}

declare global {
	interface Window {
		pianoboiAgent?: PianoBoiAgentApi;
	}
}

function signatureFor(id?: string) {
	const signature = signatures.find((item) => item.id === (id || 'C'));
	if (!signature) throw new Error(`Unknown key signature "${id}".`);
	return signature;
}

function normalizeNote(input: AgentNoteInput, signatureId?: string): PianoNote {
	const signature = signatureFor(signatureId);
	if (typeof input === 'string') {
		const match = input.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
		if (!match)
			throw new Error(`Invalid note "${input}". Use a note with an octave, such as C4 or F#3.`);
		const name = match[1].toUpperCase();
		const accidental = match[2];
		const octave = Number(match[3]);
		return {
			name,
			accidental,
			octave,
			number: calculateNoteNumber(name, accidental, octave),
			identifier: `${name}${accidental}${octave}`,
			attack: 0.5,
			release: 0.5,
			signature
		};
	}

	const name = input.name?.trim().toUpperCase();
	const accidental = input.accidental || '';
	const octave = Number(input.octave);
	if (
		!name?.match(/^[A-G]$/) ||
		!['', '#', 'b'].includes(accidental) ||
		!Number.isInteger(octave)
	) {
		throw new Error('Invalid note object. Provide name, accidental, and an integer octave.');
	}
	return {
		...input,
		name,
		accidental,
		octave,
		number: calculateNoteNumber(name, accidental, octave),
		identifier: `${name}${accidental}${octave}`,
		signature
	};
}

function normalizeChord(input: AgentChordInput, fallbackId?: string): SavedChord {
	if (!Array.isArray(input.notes) || input.notes.length === 0) {
		throw new Error('A chord must contain at least one note.');
	}
	const signature = signatureFor(input.signatureId);
	return {
		id: input.id || fallbackId || `chord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		notes: input.notes.map((note) => normalizeNote(note, signature.id)),
		signature,
		timestamp: input.timestamp || Date.now(),
		setId: input.setId || null
	};
}

function cloneChords(chords: SavedChord[]): SavedChord[] {
	return chords.map((chord) => ({ ...chord, notes: chord.notes.map((note) => ({ ...note })) }));
}

export function createBrowserAgentApi(
	scratchpad: PianoBoiScratchpadApi = createScratchpadApi()
): PianoBoiAgentApi {
	return {
		storageKeys: {
			chords: SAVED_CHORDS_STORAGE_KEY,
			sets: CHORD_SETS_STORAGE_KEY,
			scratchpad: SCRATCHPAD_STORAGE_KEY
		},
		scratchpad,
		chords: {
			list() {
				return cloneChords(loadSavedChords().savedChords);
			},
			add(input) {
				const state = loadSavedChords();
				const chord = normalizeChord(input);
				persistSavedChords([...state.savedChords, chord], state.chordSets);
				return chord;
			},
			update(id, patch) {
				const state = loadSavedChords();
				const index = state.savedChords.findIndex((chord) => chord.id === id);
				if (index < 0) throw new Error(`Chord "${id}" was not found.`);
				const current = state.savedChords[index];
				const signatureId = patch.signatureId || current.signature.id;
				const updated = normalizeChord(
					{
						id: current.id,
						notes: patch.notes || current.notes,
						signatureId,
						setId: patch.setId === undefined ? current.setId : patch.setId,
						timestamp: current.timestamp
					},
					current.id
				);
				const chords = [...state.savedChords];
				chords[index] = updated;
				persistSavedChords(chords, state.chordSets);
				return updated;
			},
			move(id, index) {
				const state = loadSavedChords();
				const from = state.savedChords.findIndex((chord) => chord.id === id);
				if (from < 0) throw new Error(`Chord "${id}" was not found.`);
				const chords = [...state.savedChords];
				const [chord] = chords.splice(from, 1);
				const target = Math.max(0, Math.min(Math.trunc(index), chords.length));
				chords.splice(target, 0, chord);
				persistSavedChords(chords, state.chordSets);
				return cloneChords(chords);
			},
			remove(id) {
				const state = loadSavedChords();
				const chords = state.savedChords.filter((chord) => chord.id !== id);
				if (chords.length === state.savedChords.length) return false;
				persistSavedChords(chords, state.chordSets);
				return true;
			},
			replaceAll(inputs) {
				const state = loadSavedChords();
				const chords = inputs.map((input) => normalizeChord(input));
				persistSavedChords(chords, state.chordSets);
				return cloneChords(chords);
			}
		},
		sets: {
			list() {
				return loadSavedChords().chordSets.map((set) => ({ ...set }));
			},
			add(name, description = '') {
				if (!name.trim()) throw new Error('A chord set needs a name.');
				const state = loadSavedChords();
				const set: ChordSet = {
					id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					name: name.trim(),
					description,
					timestamp: Date.now()
				};
				persistSavedChords(state.savedChords, [...state.chordSets, set]);
				return set;
			},
			update(id, patch) {
				const state = loadSavedChords();
				const index = state.chordSets.findIndex((set) => set.id === id);
				if (index < 0) throw new Error(`Chord set "${id}" was not found.`);
				const current = state.chordSets[index];
				const updated = {
					...current,
					name: patch.name === undefined ? current.name : patch.name.trim(),
					description: patch.description === undefined ? current.description : patch.description
				};
				if (!updated.name) throw new Error('A chord set needs a name.');
				const sets = [...state.chordSets];
				sets[index] = updated;
				persistSavedChords(state.savedChords, sets);
				return updated;
			},
			remove(id) {
				const state = loadSavedChords();
				const sets = state.chordSets.filter((set) => set.id !== id);
				if (sets.length === state.chordSets.length) return false;
				const chords = state.savedChords.map((chord) =>
					chord.setId === id ? { ...chord, setId: null } : chord
				);
				persistSavedChords(chords, sets);
				return true;
			}
		},
		help: () => AGENT_INSTRUCTIONS_TEXT
	};
}
