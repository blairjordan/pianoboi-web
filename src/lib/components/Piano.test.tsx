import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { signatures } from '../types/signatures';
import Piano from './Piano';

describe('Piano', () => {
	test('emits note-on and note-off events for the on-screen keyboard', () => {
		const onNotePress = vi.fn();
		render(<Piano signature={signatures[0]} onNotePress={onNotePress} />);
		const firstC = screen.getAllByRole('button', { name: 'C' })[0];
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
});
