import { afterEach, describe, expect, test, vi } from 'vitest';
import { startChordSequence } from './chordSequence';

describe('startChordSequence', () => {
	afterEach(() => vi.useRealTimers());

	test('plays in order, leaves time for the final chord, and completes cleanly', () => {
		vi.useFakeTimers();
		const played: string[] = [];
		const complete = vi.fn();
		startChordSequence(['C', 'F', 'G'], (chord) => played.push(chord), complete, 1000);

		expect(played).toEqual(['C']);
		vi.advanceTimersByTime(2000);
		expect(played).toEqual(['C', 'F', 'G']);
		expect(complete).not.toHaveBeenCalled();
		vi.advanceTimersByTime(1000);
		expect(complete).toHaveBeenCalledOnce();
	});

	test('can stop before another chord is played', () => {
		vi.useFakeTimers();
		const play = vi.fn();
		const complete = vi.fn();
		const stop = startChordSequence(['C', 'F'], play, complete, 1000);
		stop();
		vi.runAllTimers();

		expect(play).toHaveBeenCalledOnce();
		expect(complete).not.toHaveBeenCalled();
	});
});
