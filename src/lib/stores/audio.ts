import { writable } from 'svelte/store';

// Audio state
export const audioContext = writable<AudioContext | null>(null);
export const samplesLoaded = writable(false);
export const loadingProgress = writable(0);
export const pianoSamples = writable<Record<string, AudioBuffer>>({});
export const activeAudioNodes = writable<Record<string, any>>({});
export const playingAudioNodes = writable<Array<{ note: number; nodes: any }>>([]);

// Available piano samples
const availableSamples = [
	'A0v10.mp3',
	'A1v10.mp3',
	'A2v10.mp3',
	'A3v10.mp3',
	'A4v10.mp3',
	'A5v10.mp3',
	'A6v10.mp3',
	'A7v10.mp3',
	'C1v10.mp3',
	'C2v10.mp3',
	'C3v10.mp3',
	'C4v10.mp3',
	'C5v10.mp3',
	'C6v10.mp3',
	'C7v10.mp3',
	'C8v10.mp3',
	'Ds1v10.mp3',
	'Ds2v10.mp3',
	'Ds3v10.mp3',
	'Ds4v10.mp3',
	'Ds5v10.mp3',
	'Ds6v10.mp3',
	'Ds7v10.mp3',
	'Fs1v10.mp3',
	'Fs2v10.mp3',
	'Fs3v10.mp3',
	'Fs4v10.mp3',
	'Fs5v10.mp3',
	'Fs6v10.mp3',
	'Fs7v10.mp3'
];

// Sample map for MIDI note numbers
const sampleMap: Record<number, string> = {
	21: 'A0v10.mp3',
	33: 'A1v10.mp3',
	45: 'A2v10.mp3',
	57: 'A3v10.mp3',
	69: 'A4v10.mp3',
	81: 'A5v10.mp3',
	93: 'A6v10.mp3',
	105: 'A7v10.mp3',
	24: 'C1v10.mp3',
	36: 'C2v10.mp3',
	48: 'C3v10.mp3',
	60: 'C4v10.mp3',
	72: 'C5v10.mp3',
	84: 'C6v10.mp3',
	96: 'C7v10.mp3',
	108: 'C8v10.mp3',
	27: 'Ds1v10.mp3',
	39: 'Ds2v10.mp3',
	51: 'Ds3v10.mp3',
	63: 'Ds4v10.mp3',
	75: 'Ds5v10.mp3',
	87: 'Ds6v10.mp3',
	99: 'Ds7v10.mp3',
	30: 'Fs1v10.mp3',
	42: 'Fs2v10.mp3',
	54: 'Fs3v10.mp3',
	66: 'Fs4v10.mp3',
	78: 'Fs5v10.mp3',
	90: 'Fs6v10.mp3',
	102: 'Fs7v10.mp3'
};

// Initialize audio context
export function initAudio() {
	let ctx: AudioContext | null = null;
	audioContext.update((current) => {
		if (current) return current;

		try {
			ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
			console.log('Audio context created');
			return ctx;
		} catch (error) {
			console.error('Failed to create audio context:', error);
			return null;
		}
	});

	// If we just created a new context, load samples
	if (ctx) {
		loadPianoSamples();
	}
}

// Load piano samples
export async function loadPianoSamples() {
	let ctx: AudioContext | null = null;
	audioContext.update((current) => {
		ctx = current;
		return current;
	});

	if (!ctx) return;

	try {
		// Use static folder path
		const sampleBaseUrl = '/audio/piano10/';

		// Get the number of samples we need to load
		const totalSamples = availableSamples.length;
		let loadedSamples = 0;
		const samples: Record<string, AudioBuffer> = {};

		console.log(`Loading piano samples from: ${sampleBaseUrl}`);
		console.log(`Attempting to load ${totalSamples} samples`);

		// Function to load a single sample
		const loadSample = async (sampleFileName: string) => {
			try {
				console.log(`Trying to load: ${sampleBaseUrl}${sampleFileName}`);
				const response = await fetch(sampleBaseUrl + sampleFileName);
				if (!response.ok) {
					throw new Error(
						`Failed to fetch ${sampleFileName}: ${response.status} ${response.statusText}`
					);
				}

				console.log(`Fetched ${sampleFileName} successfully`);
				const arrayBuffer = await response.arrayBuffer();
				console.log(`Got array buffer for ${sampleFileName}: ${arrayBuffer.byteLength} bytes`);

				try {
					const audioBuffer = await ctx!.decodeAudioData(arrayBuffer);
					console.log(`Decoded audio for ${sampleFileName}: ${audioBuffer.duration} seconds`);
					samples[sampleFileName] = audioBuffer;
					loadedSamples++;
					loadingProgress.set(Math.floor((loadedSamples / totalSamples) * 100));
				} catch (decodeErr) {
					console.error(`Failed to decode ${sampleFileName}:`, decodeErr);
				}
			} catch (err) {
				console.error(`Error loading sample ${sampleFileName}:`, err);
			}
		};

		// Load all the samples in parallel for faster loading
		const loadPromises = availableSamples.map((sample) => loadSample(sample));
		await Promise.all(loadPromises);

		if (loadedSamples > 0) {
			console.log(`Successfully loaded ${loadedSamples}/${totalSamples} piano samples`);
			pianoSamples.set(samples);
			samplesLoaded.set(true);
		} else {
			console.error('Failed to load any piano samples');
		}
	} catch (error) {
		console.error('Error in loadPianoSamples:', error);
	}
}

// Find the closest sample for a given note
export function findClosestSample(midiNote: number): string {
	// Debug log for note detection
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const noteName = noteNames[midiNote % 12];
	const octave = Math.floor(midiNote / 12) - 1;
	console.log(`Finding sample for MIDI note ${midiNote}: ${noteName}${octave}`);

	// Check if this exact MIDI note has a dedicated sample
	if (sampleMap[midiNote]) {
		console.log(`Using exact sample match from sampleMap: ${sampleMap[midiNote]}`);
		return sampleMap[midiNote];
	}

	// For each note, map it to one of our available sample types
	const noteTypeMapping: Record<string, { type: string; octaveOffset: number; semitones: number }> =
		{
			C: { type: 'C', octaveOffset: 0, semitones: 0 },
			'C#': { type: 'C', octaveOffset: 0, semitones: 1 },
			D: { type: 'Ds', octaveOffset: 0, semitones: -1 },
			'D#': { type: 'Ds', octaveOffset: 0, semitones: 0 },
			E: { type: 'Ds', octaveOffset: 0, semitones: 1 },
			F: { type: 'Fs', octaveOffset: 0, semitones: -1 },
			'F#': { type: 'Fs', octaveOffset: 0, semitones: 0 },
			G: { type: 'Fs', octaveOffset: 0, semitones: 1 },
			'G#': { type: 'A', octaveOffset: 0, semitones: -1 },
			A: { type: 'A', octaveOffset: 0, semitones: 0 },
			'A#': { type: 'A', octaveOffset: 0, semitones: 1 },
			B: { type: 'A', octaveOffset: 0, semitones: 2 }
		};

	// Get mapping info for this note type
	const mapping = noteTypeMapping[noteName];
	if (!mapping) {
		console.error(`No mapping found for note ${noteName}`);
		return availableSamples[0]; // Fallback to first available sample
	}

	// Calculate target octave with any offsets
	const targetOctave = octave + mapping.octaveOffset;

	// Construct a complete filename
	const sampleFilename = `${mapping.type}${targetOctave}v10.mp3`;

	// Check if this sample exists in our available samples list
	if (availableSamples.includes(sampleFilename)) {
		console.log(
			`Using mapped sample ${sampleFilename} for ${noteName}${octave} (MIDI ${midiNote}) with pitch shift ${mapping.semitones}`
		);
		return sampleFilename;
	}

	// If the exact octave sample isn't available, find closest octave for the same note type
	const samplesOfType = availableSamples.filter(
		(sample) => sample.startsWith(mapping.type) && sample.endsWith('v10.mp3')
	);

	if (samplesOfType.length === 0) {
		// Fallback to A4 as a safe default
		console.warn(
			`No samples of type ${mapping.type} found for ${noteName}${octave}, using fallback`
		);
		return 'A4v10.mp3';
	}

	// Find closest octave for this sample type
	let bestSample = '';
	let smallestOctaveDiff = Infinity;

	for (const sample of samplesOfType) {
		// Extract the octave number from the sample filename
		const match = sample.match(/([A-G][s#]?)(\d+)v/);
		if (!match) continue;

		const sampleOctave = parseInt(match[2], 10);
		const octaveDiff = Math.abs(sampleOctave - targetOctave);

		if (octaveDiff < smallestOctaveDiff) {
			smallestOctaveDiff = octaveDiff;
			bestSample = sample;
		}
	}

	console.log(
		`Using closest octave sample ${bestSample} for ${noteName}${octave} (MIDI ${midiNote})`
	);
	return bestSample;
}

// Function to convert MIDI note number to frequency
export function midiToFrequency(midiNote: number): number {
	return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Play a note using piano samples
export function playNote(midiNote: number) {
	let ctx: AudioContext | null = null;
	let samples: Record<string, AudioBuffer> = {};
	let isLoaded = false;

	audioContext.update((current) => {
		ctx = current;
		return current;
	});

	pianoSamples.update((current) => {
		samples = current;
		return current;
	});

	samplesLoaded.update((current) => {
		isLoaded = current;
		return current;
	});

	if (!ctx) {
		initAudio();
		audioContext.update((current) => {
			ctx = current;
			return current;
		});

		if (!ctx) return null;
	}

	try {
		// Check if we have enough samples loaded
		if (isLoaded && Object.keys(samples).length > 0) {
			// Get the note information
			const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
			const noteName = noteNames[midiNote % 12];
			const octave = Math.floor(midiNote / 12) - 1;

			// Find the closest sample
			const sampleName = findClosestSample(midiNote);

			// Check if we actually have this sample loaded
			if (samples[sampleName]) {
				console.log(`Playing note ${midiNote} (${noteName}${octave}) using sample ${sampleName}`);

				// Create audio buffer source
				const source = ctx.createBufferSource();
				source.buffer = samples[sampleName];

				// Get the note and octave from the sample filename
				const match = sampleName.match(/([A-G][s#]?)(\d+)v/);
				if (!match) {
					console.error(`Invalid sample name format: ${sampleName}`);
					return null;
				}

				const sampleNoteName = match[1];
				const sampleOctave = parseInt(match[2], 10);

				// Calculate the sample's MIDI note number
				const sampleMidiNote = calculateMidiFromName(sampleNoteName, sampleOctave);

				// Calculate the semitone difference for pitch shifting
				const semitones = midiNote - sampleMidiNote;

				console.log(
					`Note ${midiNote} (${noteName}${octave}), Sample ${sampleName} (MIDI: ${sampleMidiNote}), Semitones: ${semitones}`
				);

				// Apply pitch adjustment with limits to prevent extreme stretching
				const maxAllowedShift = noteName === 'B' ? 12 : 4;

				// Use oscillator for extreme shifts (this would need to be implemented)
				if (Math.abs(semitones) > maxAllowedShift) {
					console.log(
						`Excessive pitch shift (${semitones} semitones) for note ${midiNote}, using oscillator`
					);
					return null;
				}

				// Calculate the pitch ratio
				const ratio = Math.pow(2, semitones / 12);
				source.playbackRate.value = ratio;

				console.log(`Playback rate: ${ratio.toFixed(3)}`);

				// Create gain node for envelope
				const gainNode = ctx.createGain();
				gainNode.gain.value = 0.0; // Start silent and ramp up

				// Connect nodes
				source.connect(gainNode);
				gainNode.connect(ctx.destination);

				// Start playing
				source.start();

				// Apply envelope: fairly rapid attack, slow decay
				const now = ctx.currentTime;

				// Attack phase
				gainNode.gain.setValueAtTime(0, now);
				gainNode.gain.linearRampToValueAtTime(1, now + 0.02); // 20ms attack

				// Adjust decay based on pitch shift - shorter decay for higher shifts
				const pitchShiftFactor = Math.abs(semitones) / 12;
				const decayTime = 0.5 * (1 - pitchShiftFactor * 0.2);
				gainNode.gain.linearRampToValueAtTime(0.7, now + decayTime);

				// Release time also varies with pitch shift
				const releaseTime = 4.0 * (1 - pitchShiftFactor * 0.1);
				gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

				// Store the nodes to be able to stop them later
				const nodes = { source, gainNode };
				return nodes;
			} else {
				console.warn(`Sample ${sampleName} not found for note ${midiNote}`);
				return null;
			}
		} else {
			console.log(`Not enough samples loaded for note ${midiNote}`);
			return null;
		}
	} catch (error) {
		console.error('Error playing note:', error);
		return null;
	}
}

// Stop a note
export function stopNote(nodes: any) {
	if (!nodes) return;

	try {
		if (nodes.source) {
			nodes.source.stop();
		}
		if (nodes.gainNode) {
			nodes.gainNode.disconnect();
		}
	} catch (err) {
		console.error('Error stopping note:', err);
	}
}

// Calculate MIDI note number from note name and octave
export function calculateMidiFromName(noteName: string, octave: number): number {
	// Normalize both # and s notations to use # internally
	const normalizedName = noteName.replace('s', '#');

	const noteValues: Record<string, number> = {
		C: 0,
		'C#': 1,
		D: 2,
		'D#': 3,
		E: 4,
		F: 5,
		'F#': 6,
		G: 7,
		'G#': 8,
		A: 9,
		'A#': 10,
		B: 11,
		Db: 1,
		Eb: 3,
		Gb: 6,
		Ab: 8,
		Bb: 10
	};

	if (!(normalizedName in noteValues)) {
		console.error(`Invalid note name: ${noteName} (normalized to ${normalizedName})`);
		return 60; // Default to middle C
	}

	const noteValue = noteValues[normalizedName];
	return (octave + 1) * 12 + noteValue;
}

// Clean up audio resources
export function cleanupAudio() {
	// Clean up audio context when component is destroyed
	audioContext.update((ctx) => {
		if (ctx) {
			ctx.close().catch((e) => console.error('Error closing audio context:', e));
		}
		return null;
	});

	// Clear other audio resources
	pianoSamples.set({});
	activeAudioNodes.set({});
	playingAudioNodes.set([]);
	samplesLoaded.set(false);
	loadingProgress.set(0);
}
