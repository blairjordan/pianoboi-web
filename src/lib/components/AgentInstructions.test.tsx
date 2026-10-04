import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createBrowserAgentApi } from '../utils/browserAgent';
import AgentInstructions from './AgentInstructions';

describe('AgentInstructions', () => {
	beforeEach(() => {
		localStorage.clear();
		window.pianoboiAgent = createBrowserAgentApi();
	});

	afterEach(() => {
		cleanup();
		delete window.pianoboiAgent;
	});

	test('applies a JSON chord and scratchpad update through visible controls', () => {
		render(<AgentInstructions onClose={() => undefined} />);
		fireEvent.change(screen.getByRole('textbox', { name: 'Agent update JSON' }), {
			target: {
				value: JSON.stringify({
					chords: [{ notes: ['F3', 'A3', 'C4', 'E4'], signatureId: 'F' }],
					scratchpad: '# Soulful'
				})
			}
		});
		fireEvent.click(screen.getByRole('button', { name: 'Apply browser-memory update' }));

		expect(window.pianoboiAgent?.chords.list()[0].notes).toHaveLength(4);
		expect(window.pianoboiAgent?.scratchpad.get()).toBe('# Soulful');
		expect(screen.getByRole('status')).toHaveTextContent('Applied 2 updates.');
	});
});
