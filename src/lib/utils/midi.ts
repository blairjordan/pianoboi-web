// MIDI utilities for PianoBoi
import type { Input, NoteMessageEvent } from 'webmidi';
import { WebMidi } from 'webmidi';

/**
 * Initialize WebMidi
 */
export async function initializeWebMidi(): Promise<{
	midiEnabled: boolean;
	midiInputs: Input[];
	midiError: string;
}> {
	try {
		const midiError = '';

		if (!WebMidi.enabled) {
			await WebMidi.enable();
		}

		const midiEnabled = true;
		const midiInputs = WebMidi.inputs;
		console.log('MIDI Inputs:', midiInputs);

		return { midiEnabled, midiInputs, midiError };
	} catch (err: unknown) {
		console.error('WebMidi could not be enabled:', err);
		const midiError = `Could not enable WebMidi: ${err instanceof Error ? err.message : String(err)}`;

		return {
			midiEnabled: false,
			midiInputs: [],
			midiError
		};
	}
}

/**
 * Set up MIDI listeners on a selected input
 */
export function setupMidiListeners(
	selectedInput: Input | null,
	handleNoteOn: (e: NoteMessageEvent) => void,
	handleNoteOff: (e: NoteMessageEvent) => void
): void {
	if (!selectedInput) return;

	// Clean up previous listeners
	try {
		selectedInput.removeListener('noteon');
		selectedInput.removeListener('noteoff');
	} catch (e) {
		console.warn('Error removing listeners:', e);
	}

	// Set up note listeners. A disconnected or stale device can briefly have no channels.
	const firstChannel = selectedInput.channels?.[1];
	if (!firstChannel) {
		console.warn(`MIDI input ${selectedInput.name} is not ready yet`);
		return;
	}
	firstChannel.addListener('noteon', handleNoteOn);
	firstChannel.addListener('noteoff', handleNoteOff);

	console.log('MIDI listeners set up for', selectedInput.name);
}

/**
 * Disable WebMidi and clean up resources
 */
export function disableWebMidi(): void {
	if (WebMidi.enabled) {
		try {
			WebMidi.disable();
		} catch (e) {
			console.error('Error disabling WebMidi:', e);
		}
	}
}
