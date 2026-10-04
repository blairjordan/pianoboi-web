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

	test('renders compact mode as a full-width abstract pitch ribbon', () => {
		const { container } = render(<Piano overview showLabels signature={signatures[0]} />);
		const ribbon = screen.getByTestId('pitch-ribbon');
		const middleC = within(container).getByRole('button', { name: 'C4' });
		expect(ribbon).toHaveClass('w-full');
		expect(within(ribbon).getAllByRole('button')).toHaveLength(84);
		expect(container.querySelector('.white-key')).not.toBeInTheDocument();
		expect(container.querySelector('.black-key')).not.toBeInTheDocument();
		expect(middleC).toHaveTextContent('');
	});

	test('keeps saved-chord compact mode readable and labelled', () => {
		const { container } = render(<Piano compact showLabels signature={signatures[0]} />);
		const middleC = within(container).getByRole('button', { name: 'C4' });
		expect(middleC).toHaveClass('h-20', 'w-[1.4rem]');
		expect(middleC).toHaveTextContent('C');
	});
});
