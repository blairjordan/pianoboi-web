interface BrowserSpeechRecognitionAlternative {
	readonly transcript: string;
	readonly confidence: number;
}

interface BrowserSpeechRecognitionResult {
	readonly isFinal: boolean;
	readonly length: number;
	readonly [index: number]: BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionResultList {
	readonly length: number;
	readonly [index: number]: BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent extends Event {
	readonly resultIndex: number;
	readonly results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent extends Event {
	readonly error: string;
	readonly message: string;
}

interface BrowserSpeechRecognition extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	onstart: ((event: Event) => void) | null;
	onend: ((event: Event) => void) | null;
	onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
	onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
	start(): void;
	stop(): void;
	abort(): void;
}

interface BrowserSpeechRecognitionConstructor {
	new (): BrowserSpeechRecognition;
}

interface Window {
	SpeechRecognition?: BrowserSpeechRecognitionConstructor;
	webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
}
