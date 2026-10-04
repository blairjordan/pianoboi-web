import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoiceSaveState {
	isSupported: boolean;
	isEnabled: boolean;
	isListening: boolean;
	error: string | null;
	start: () => void;
	stop: () => void;
}

const RESTART_DELAY_MS = 250;

function getRecognitionConstructor(): BrowserSpeechRecognitionConstructor | null {
	if (typeof window === 'undefined') return null;
	return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function describeRecognitionError(error: string): string {
	switch (error) {
		case 'not-allowed':
		case 'service-not-allowed':
			return 'Microphone permission was denied. Allow microphone access to use voice save.';
		case 'audio-capture':
			return 'No microphone is available.';
		case 'network':
			return 'Voice recognition could not reach the speech service.';
		default:
			return 'Voice recognition stopped unexpectedly. Please try again.';
	}
}

function isFatalRecognitionError(error: string): boolean {
	return ['not-allowed', 'service-not-allowed', 'audio-capture'].includes(error);
}

export function useVoiceSave(onSave: () => void, language = 'en-AU'): VoiceSaveState {
	const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
	const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const shouldListenRef = useRef(false);
	const processedResultsRef = useRef(new Set<string>());
	const onSaveRef = useRef(onSave);
	const [isEnabled, setIsEnabled] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const isSupported = getRecognitionConstructor() !== null;

	onSaveRef.current = onSave;

	const clearRestartTimer = useCallback(() => {
		if (restartTimerRef.current !== null) {
			clearTimeout(restartTimerRef.current);
			restartTimerRef.current = null;
		}
	}, []);

	const stop = useCallback(() => {
		shouldListenRef.current = false;
		clearRestartTimer();
		setIsEnabled(false);
		setIsListening(false);

		try {
			recognitionRef.current?.stop();
		} catch {
			// A recognition instance that has already ended can throw on stop.
		}
	}, [clearRestartTimer]);

	const start = useCallback(() => {
		if (shouldListenRef.current) return;

		const Recognition = getRecognitionConstructor();
		if (!Recognition) {
			setError('Voice save is not supported in this browser.');
			return;
		}

		clearRestartTimer();
		setError(null);
		shouldListenRef.current = true;
		setIsEnabled(true);
		processedResultsRef.current.clear();

		const recognition = new Recognition();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = language;
		recognitionRef.current = recognition;

		recognition.onstart = () => {
			if (shouldListenRef.current) setIsListening(true);
		};

		recognition.onresult = (event) => {
			for (let index = event.resultIndex; index < event.results.length; index += 1) {
				const result = event.results[index];
				if (!result?.isFinal) continue;

				const transcript = result[0]?.transcript.trim().toLocaleLowerCase() ?? '';
				const resultKey = `${index}:${transcript}`;
				if (processedResultsRef.current.has(resultKey)) continue;
				processedResultsRef.current.add(resultKey);

				if (/(^|\s)save(?=\s|[.!?,;:]|$)/u.test(transcript)) onSaveRef.current();
			}
		};

		recognition.onerror = (event) => {
			setIsListening(false);
			if (event.error === 'aborted' && !shouldListenRef.current) return;
			if (event.error !== 'no-speech') setError(describeRecognitionError(event.error));

			if (isFatalRecognitionError(event.error)) {
				shouldListenRef.current = false;
				setIsEnabled(false);
			}
		};

		recognition.onend = () => {
			setIsListening(false);
			if (!shouldListenRef.current || recognitionRef.current !== recognition) return;

			clearRestartTimer();
			restartTimerRef.current = setTimeout(() => {
				restartTimerRef.current = null;
				if (!shouldListenRef.current || recognitionRef.current !== recognition) return;
				processedResultsRef.current.clear();
				try {
					recognition.start();
				} catch {
					shouldListenRef.current = false;
					setIsEnabled(false);
					setError('Voice recognition could not restart. Please try again.');
				}
			}, RESTART_DELAY_MS);
		};

		try {
			recognition.start();
		} catch {
			shouldListenRef.current = false;
			setIsEnabled(false);
			setError('Voice recognition could not start. Please try again.');
		}
	}, [clearRestartTimer, language]);

	useEffect(
		() => () => {
			shouldListenRef.current = false;
			clearRestartTimer();
			const recognition = recognitionRef.current;
			if (!recognition) return;
			recognition.onstart = null;
			recognition.onresult = null;
			recognition.onerror = null;
			recognition.onend = null;
			try {
				recognition.abort();
			} catch {
				// The browser may already have disposed of the recognition session.
			}
		},
		[clearRestartTimer]
	);

	return { isSupported, isEnabled, isListening, error, start, stop };
}
