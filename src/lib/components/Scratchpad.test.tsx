import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createScratchpadApi, SCRATCHPAD_STORAGE_KEY } from '../utils/scratchpad';
import Scratchpad, { ScratchpadMarkdown } from './Scratchpad';

describe('Scratchpad', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
	});

	test('renders safe Markdown and piano learning components', () => {
		render(
			<ScratchpadMarkdown
				content={
					'# Verse\nPlay <Key>C4</Key>, then <Key note="E4" />.\n<Chord name="C major"><Keys>C4 E4 G4</Keys></Chord>\n[unsafe](javascript:alert(1))'
				}
			/>
		);

		expect(screen.getByRole('heading', { name: 'Verse' })).toBeInTheDocument();
		expect(screen.getAllByTitle('Piano key C4')).toHaveLength(2);
		expect(screen.getAllByTitle('Piano key E4')).toHaveLength(2);
		expect(screen.getByText('C major')).toBeInTheDocument();
		expect(screen.getAllByTitle('Piano key G4')).toHaveLength(1);
		expect(screen.getByText('unsafe')).not.toHaveAttribute('href');
	});

	test('updates immediately through the window API and notices direct same-tab storage writes', () => {
		vi.useFakeTimers();
		render(<Scratchpad onClose={() => undefined} />);

		const api = createScratchpadApi();
		act(() => api.set('Try <Key>D4</Key>'));
		expect(screen.getByText('Try')).toBeInTheDocument();
		expect(screen.getByTitle('Piano key D4')).toBeInTheDocument();
		expect(localStorage.getItem(SCRATCHPAD_STORAGE_KEY)).toBe('Try <Key>D4</Key>');

		act(() => {
			localStorage.setItem(SCRATCHPAD_STORAGE_KEY, '**Updated elsewhere**');
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByText('Updated elsewhere')).toBeInTheDocument();
	});
});
