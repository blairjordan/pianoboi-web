import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { WebMidi, type Input, type NoteMessageEvent } from 'webmidi';

export interface MidiNote {
	name: string;
	accidental: string;
	octave: number;
	number: number;
	identifier: string;
	attack: number;
	release: number;
}

// MIDI state
export const midiEnabled = writable(false);
export const midiInputs = writable<Input[]>([]);
export const selectedInput = writable<Input | null>(null);
export const activeNotes = writable<MidiNote[]>([]);
export const midiError = writable('');
export const isInitializing = writable(false);

// MIDI functionality
export async function initializeWebMidi() {
	try {
		isInitializing.set(true);
		midiError.set('');

		if (!WebMidi.enabled) {
			await WebMidi.enable();
		}

		midiEnabled.set(true);
		midiInputs.set(WebMidi.inputs);
		console.log('MIDI Inputs:', WebMidi.inputs);

		// Auto-select first input if available
		if (WebMidi.inputs.length > 0) {
			const input = WebMidi.inputs[0];
			selectedInput.set(input);
			setupMidiListeners(input);
		}
	} catch (err: unknown) {
		console.error('WebMidi could not be enabled:', err);
		midiError.set(`Could not enable WebMidi: ${err instanceof Error ? err.message : String(err)}`);
		midiEnabled.set(false);
	} finally {
		isInitializing.set(false);
	}
}

export function refreshMidiDevices() {
	let currentInput: Input | null = null;
	selectedInput.update((current) => {
		currentInput = current;
		return null;
	});

	if (currentInput) {
		// Clean up before refreshing
		try {
			// Using type assertion to handle WebMidi API
			(currentInput as any).removeListener('noteon');
			(currentInput as any).removeListener('noteoff');
		} catch (e) {
			console.warn('Error removing listeners:', e);
		}
		activeNotes.set([]);
	}

	initializeWebMidi();
}

export function selectInput(input: Input) {
	selectedInput.set(input);
	setupMidiListeners(input);
	console.log('MIDI input changed to:', input.name);
}

function setupMidiListeners(input: Input) {
	if (!input) return;

	// Clean up previous listeners
	try {
		// Using type assertion to handle WebMidi API
		(input as any).removeListener('noteon');
		(input as any).removeListener('noteoff');
	} catch (e) {
		console.warn('Error removing listeners:', e);
	}

	// Set up note listeners
	input.channels[1].addListener('noteon', handleNoteOn);
	input.channels[1].addListener('noteoff', handleNoteOff);

	console.log('MIDI listeners set up for', input.name);
}

function handleNoteOn(e: NoteMessageEvent) {
	console.log('Note ON:', e.note);

	// Create a standardized note object
	const note: MidiNote = {
		name: e.note.name,
		accidental: e.note.accidental || '',
		octave: e.note.octave,
		number: e.note.number,
		identifier: `${e.note.name}${e.note.accidental || ''}${e.note.octave}`,
		attack: e.note.attack || 0.5,
		release: e.note.release || 0.5
	};

	activeNotes.update((notes) => [...notes, note]);
}

function handleNoteOff(e: NoteMessageEvent) {
	console.log('Note OFF:', e.note);

	// Filter using note number and octave
	activeNotes.update((notes) =>
		notes.filter((note) => !(note.number === e.note.number && note.octave === e.note.octave))
	);
}

// Clean up function for when component is destroyed
export function cleanupMidi() {
	if (browser && WebMidi.enabled) {
		try {
			WebMidi.disable();
		} catch (e) {
			console.error('Error disabling WebMidi:', e);
		}
	}
}

// Calculate MIDI note number
export function calculateNoteNumber(noteName: string, accidental: string, octave: number): number {
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
