export interface PianoNote {
	name: string;
	accidental: string;
	octave: number;
	number: number;
	identifier: string;
	attack?: number;
	release?: number;
	signature?: unknown;
}
