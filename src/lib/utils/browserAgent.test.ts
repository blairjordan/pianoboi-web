import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CHORDS_CHANGE_EVENT } from './chords';
import { createBrowserAgentApi } from './browserAgent';

describe('browser agent API', () => {
	beforeEach(() => localStorage.clear());

	test('stores, modifies, moves, and removes chords with immediate change events', () => {
		const api = createBrowserAgentApi();
		const onChange = vi.fn();
		window.addEventListener(CHORDS_CHANGE_EVENT, onChange);

		const first = api.chords.add({ notes: ['C4', 'E4', 'G4'], signatureId: 'C' });
		const second = api.chords.add({ notes: ['D4', 'F#4', 'A4'], signatureId: 'D' });
		expect(api.chords.list().map((chord) => chord.id)).toEqual([first.id, second.id]);
		expect(first.notes.map((note) => note.identifier)).toEqual(['C4', 'E4', 'G4']);

		const updated = api.chords.update(first.id, {
			notes: ['F3', 'A3', 'C4'],
			signatureId: 'F'
		});
		expect(updated.signature.id).toBe('F');
		expect(updated.notes.map((note) => note.identifier)).toEqual(['F3', 'A3', 'C4']);

		expect(api.chords.move(second.id, 0).map((chord) => chord.id)).toEqual([second.id, first.id]);
		expect(api.chords.remove(first.id)).toBe(true);
		expect(api.chords.list()).toHaveLength(1);
		expect(onChange).toHaveBeenCalledTimes(5);

		window.removeEventListener(CHORDS_CHANGE_EVENT, onChange);
	});

	test('manages chord sets and exposes scratchpad and storage discovery', () => {
		const api = createBrowserAgentApi();
		const verse = api.sets.add('Verse');
		const chord = api.chords.add({
			notes: ['Bb3', 'D4', 'F4'],
			signatureId: 'Bb',
			setId: verse.id
		});

		expect(api.sets.list()[0].name).toBe('Verse');
		expect(api.chords.list()[0].setId).toBe(verse.id);
		expect(api.sets.remove(verse.id)).toBe(true);
		expect(api.chords.list()[0].setId).toBeNull();

		api.scratchpad.set('Try <Key>Bb3</Key>');
		expect(api.scratchpad.get()).toContain('Bb3');
		expect(api.storageKeys.chords).toBe('pianoboi-saved-chords');
		expect(api.help()).toContain('window.pianoboiAgent');
		expect(chord.notes[0].identifier).toBe('Bb3');
	});
});
