import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import VoiceSaveControl from './VoiceSaveControl';

class MockSpeechRecognition extends EventTarget implements BrowserSpeechRecognition {
	static instances: MockSpeechRecognition[] = [];
	continuous = false;
	interimResults = false;
	lang = '';
	onstart: ((event: Event) => void) | null = null;
	onend: ((event: Event) => void) | null = null;
	onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null = null;
	onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null = null;
	start = vi.fn(() => this.onstart?.(new Event('start')));
	stop = vi.fn();
	abort = vi.fn();

	constructor() {
		super();
		MockSpeechRecognition.instances.push(this);
	}

	emitResult(transcript: string, isFinal: boolean, resultIndex = 0) {
		const alternative = { transcript, confidence: 0.95 };
		const result = { 0: alternative, isFinal, length: 1 };
		const results = { [resultIndex]: result, length: resultIndex + 1 };
		this.onresult?.({ resultIndex, results } as unknown as BrowserSpeechRecognitionEvent);
	}

	emitEnd() {
		this.onend?.(new Event('end'));
	}

	emitError(error: string) {
		this.onerror?.({ error, message: '' } as unknown as BrowserSpeechRecognitionErrorEvent);
	}
}

function installRecognitionApi() {
	Object.defineProperty(window, 'SpeechRecognition', {
		configurable: true,
		writable: true,
		value: MockSpeechRecognition
	});
}

describe('VoiceSaveControl', () => {
	beforeEach(() => {
		MockSpeechRecognition.instances = [];
		delete window.SpeechRecognition;
		delete window.webkitSpeechRecognition;
	});

	afterEach(() => {
		cleanup();
		vi.useRealTimers();
		delete window.SpeechRecognition;
		delete window.webkitSpeechRecognition;
	});

	test('does not create or start recognition until the user enables it', () => {
		installRecognitionApi();
		render(<VoiceSaveControl onSave={vi.fn()} />);

		expect(MockSpeechRecognition.instances).toHaveLength(0);
		fireEvent.click(screen.getByRole('button', { name: 'Start voice save' }));

		const recognition = MockSpeechRecognition.instances[0];
		expect(recognition.start).toHaveBeenCalledOnce();
		expect(recognition.continuous).toBe(true);
		expect(recognition.interimResults).toBe(true);
		expect(recognition.lang).toBe('en-AU');
		expect(screen.getByRole('status')).toHaveTextContent('Listening — say “save”');
	});

	test('saves once for a final save command and ignores interim or duplicate results', () => {
		installRecognitionApi();
		const onSave = vi.fn();
		render(<VoiceSaveControl onSave={onSave} />);
		fireEvent.click(screen.getByRole('button', { name: 'Start voice save' }));
		const recognition = MockSpeechRecognition.instances[0];

		act(() => recognition.emitResult('save', false));
		expect(onSave).not.toHaveBeenCalled();

		act(() => recognition.emitResult('please save this', true));
		act(() => recognition.emitResult('please save this', true));
		expect(onSave).toHaveBeenCalledOnce();
	});

	test('restarts after recognition ends while enabled and stops explicitly', () => {
		vi.useFakeTimers();
		installRecognitionApi();
		render(<VoiceSaveControl onSave={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Start voice save' }));
		const recognition = MockSpeechRecognition.instances[0];

		act(() => recognition.emitEnd());
		act(() => vi.advanceTimersByTime(250));
		expect(recognition.start).toHaveBeenCalledTimes(2);

		fireEvent.click(screen.getByRole('button', { name: 'Stop voice save' }));
		expect(recognition.stop).toHaveBeenCalledOnce();
		act(() => recognition.emitEnd());
		act(() => vi.advanceTimersByTime(250));
		expect(recognition.start).toHaveBeenCalledTimes(2);
		expect(screen.getByRole('status')).toHaveTextContent('Voice save is off');
	});

	test('shows unsupported and permission error states', () => {
		const { unmount } = render(<VoiceSaveControl onSave={vi.fn()} />);
		expect(screen.getByRole('button', { name: 'Start voice save' })).toBeDisabled();
		expect(screen.getByRole('status')).toHaveTextContent(
			'Voice save is unavailable in this browser'
		);
		unmount();

		installRecognitionApi();
		render(<VoiceSaveControl onSave={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Start voice save' }));
		act(() => MockSpeechRecognition.instances[0].emitError('not-allowed'));

		expect(screen.getByRole('status')).toHaveTextContent('Microphone permission was denied');
		expect(screen.getByRole('button', { name: 'Start voice save' })).toHaveAttribute(
			'aria-pressed',
			'false'
		);
	});

	test('aborts recognition and removes callbacks on unmount', () => {
		installRecognitionApi();
		const { unmount } = render(<VoiceSaveControl onSave={vi.fn()} />);
		fireEvent.click(screen.getByRole('button', { name: 'Start voice save' }));
		const recognition = MockSpeechRecognition.instances[0];

		unmount();
		expect(recognition.abort).toHaveBeenCalledOnce();
		expect(recognition.onresult).toBeNull();
		expect(recognition.onend).toBeNull();
	});
});
