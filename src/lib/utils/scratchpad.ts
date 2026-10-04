export const SCRATCHPAD_STORAGE_KEY = 'pianoboi-scratchpad';
export const SCRATCHPAD_CHANGE_EVENT = 'pianoboi:scratchpad-change';

export interface PianoBoiScratchpadApi {
	readonly storageKey: typeof SCRATCHPAD_STORAGE_KEY;
	get: () => string;
	set: (content: string) => void;
	append: (content: string) => void;
	clear: () => void;
}

declare global {
	interface Window {
		pianoboiScratchpad?: PianoBoiScratchpadApi;
	}
}

export function readScratchpad(): string {
	if (typeof window === 'undefined') return '';
	return window.localStorage.getItem(SCRATCHPAD_STORAGE_KEY) || '';
}

export function writeScratchpad(content: string): void {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(SCRATCHPAD_STORAGE_KEY, content);
	window.dispatchEvent(new CustomEvent(SCRATCHPAD_CHANGE_EVENT, { detail: content }));
}

export function createScratchpadApi(): PianoBoiScratchpadApi {
	return {
		storageKey: SCRATCHPAD_STORAGE_KEY,
		get: readScratchpad,
		set: writeScratchpad,
		append(content: string) {
			const current = readScratchpad();
			writeScratchpad(current ? `${current}\n${content}` : content);
		},
		clear() {
			writeScratchpad('');
		}
	};
}
