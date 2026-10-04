import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { signatures } from '../types/signatures';
import Piano from './Piano';

describe('Piano', () => {
	test('emits note-on and note-off events for the on-screen keyboard', () => {
		const onNotePress = vi.fn();
		render(<Piano signature={signatures[0]} onNotePress={onNotePress} />);
		const firstC = screen.getByRole('button', { name: 'C1' });
		fireEvent.mouseDown(firstC);
		fireEvent.mouseUp(firstC);
		expect(onNotePress).toHaveBeenNthCalledWith(1, {
			name: 'C',
			accidental: '',
			octave: 1,
			isOn: true
		});
		expect(onNotePress).toHaveBeenNthCalledWith(2, {
			name: 'C',
			accidental: '',
			octave: 1,
			isOn: false
		});
	});

	test('renders compact mode as a full-width compressed black-and-white keyboard', () => {
		const { container } = render(<Piano overview showLabels signature={signatures[0]} />);
		const keyboard = screen.getByTestId('compact-keyboard');
		const middleC = within(container).getByRole('button', { name: 'C4' });
		expect(keyboard).toHaveClass('w-full', 'h-14');
		expect(within(keyboard).getAllByRole('button')).toHaveLength(84);
		expect(container.querySelectorAll('.white-key')).toHaveLength(49);
		expect(container.querySelectorAll('.black-key')).toHaveLength(35);
		expect(middleC).toHaveTextContent('');
	});

	test('keeps saved-chord compact mode readable and labelled', () => {
		const { container } = render(<Piano compact showLabels signature={signatures[0]} />);
		const middleC = within(container).getByRole('button', { name: 'C4' });
		expect(middleC).toHaveClass('h-20', 'w-[1.4rem]');
		expect(middleC).toHaveTextContent('C');
	});

	test('shows practice targets separately from currently active notes', () => {
		const practiceNotes = [
			{ name: 'C', accidental: '', octave: 4 },
			{ name: 'E', accidental: '', octave: 4 }
		];
		const { container, rerender } = render(
			<Piano overview signature={signatures[0]} practiceNotes={practiceNotes} />
		);
		expect(within(container).getByRole('button', { name: 'C4' })).toHaveClass('practice');
		expect(within(container).getByRole('button', { name: 'E4' })).toHaveClass('practice');

		rerender(
			<Piano
				overview
				signature={signatures[0]}
				notes={[{ name: 'C', accidental: '', octave: 4 }]}
				practiceNotes={practiceNotes}
			/>
		);
		expect(within(container).getByRole('button', { name: 'C4' })).toHaveClass('active');
		expect(within(container).getByRole('button', { name: 'C4' })).not.toHaveClass('practice');
		expect(within(container).getByRole('button', { name: 'E4' })).toHaveClass('practice');
	});
});
