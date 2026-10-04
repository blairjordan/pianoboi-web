import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { signatures } from '../types/signatures';
import type { SavedChord } from '../utils/chords';
import SavedChordsList from './SavedChordsList';

const chords: SavedChord[] = [
	{
		id: 'chord-one',
		notes: [{ name: 'C', accidental: '', octave: 4, number: 60, identifier: 'C4' }],
		signature: signatures[0],
		timestamp: 1,
		setId: 'verse'
	},
	{
		id: 'chord-two',
		notes: [{ name: 'G', accidental: '', octave: 4, number: 67, identifier: 'G4' }],
		signature: signatures[0],
		timestamp: 2,
		setId: null
	}
];

const baseProps = {
	chords,
	chordSets: [{ id: 'verse', name: 'Verse', timestamp: 1 }],
	currentSetId: 'verse',
	currentChordId: null,
	playingChordId: null,
	viewMode: 'keyboard' as const,
	onSetCurrentChord: vi.fn(),
	onDeleteChord: vi.fn(),
	onPlayChord: vi.fn(),
	onPlayAll: vi.fn(),
	onStopAll: vi.fn(),
	onAssignToSet: vi.fn(),
	onClearChords: vi.fn()
};

describe('SavedChordsList playback controls', () => {
	afterEach(cleanup);

	test('plays the visible set and exposes a stop control while sequencing', () => {
		const onPlayAll = vi.fn();
		const onStopAll = vi.fn();
		const { rerender } = render(
			<SavedChordsList
				{...baseProps}
				onPlayAll={onPlayAll}
				onStopAll={onStopAll}
				isPlayingAll={false}
			/>
		);

		expect(screen.getByRole('heading', { name: 'Verse (1 chord)' })).toBeInTheDocument();
		fireEvent.click(screen.getByRole('button', { name: 'Play all Verse chords' }));
		expect(onPlayAll).toHaveBeenCalledOnce();

		rerender(
			<SavedChordsList {...baseProps} onPlayAll={onPlayAll} onStopAll={onStopAll} isPlayingAll />
		);
		fireEvent.click(screen.getByRole('button', { name: 'Stop chord sequence' }));
		expect(onStopAll).toHaveBeenCalledOnce();
	});
});
