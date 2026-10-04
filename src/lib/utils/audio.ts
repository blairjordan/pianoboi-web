// Audio utilities for PianoBoi

// The actual available sample files we have in static/audio/piano10/
export const availableSamples = [
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

// This maps MIDI note numbers to sample filenames
// The format of the samples is {NOTE}{OCTAVE}v{VELOCITY}.mp3
// IMPORTANT: We only have samples for A, C, Ds, and Fs notes (D-sharp and F-sharp using 's' instead of '#')
export const sampleMap: Record<number, string> = {
	21: 'A0v10.mp3', // A0
	33: 'A1v10.mp3', // A1
	45: 'A2v10.mp3', // A2
	57: 'A3v10.mp3', // A3
	69: 'A4v10.mp3', // A4
	81: 'A5v10.mp3', // A5
	93: 'A6v10.mp3', // A6
	105: 'A7v10.mp3', // A7
	24: 'C1v10.mp3', // C1
	36: 'C2v10.mp3', // C2
	48: 'C3v10.mp3', // C3
	60: 'C4v10.mp3', // C4 (middle C)
	72: 'C5v10.mp3', // C5
	84: 'C6v10.mp3', // C6
	96: 'C7v10.mp3', // C7
	108: 'C8v10.mp3', // C8
	27: 'Ds1v10.mp3', // D#1
	39: 'Ds2v10.mp3', // D#2
	51: 'Ds3v10.mp3', // D#3
	63: 'Ds4v10.mp3', // D#4
	75: 'Ds5v10.mp3', // D#5
	87: 'Ds6v10.mp3', // D#6
	99: 'Ds7v10.mp3', // D#7
	30: 'Fs1v10.mp3', // F#1
	42: 'Fs2v10.mp3', // F#2
	54: 'Fs3v10.mp3', // F#3
	66: 'Fs4v10.mp3', // F#4
	78: 'Fs5v10.mp3', // F#5
	90: 'Fs6v10.mp3', // F#6
	102: 'Fs7v10.mp3' // F#7
};

// Initialize audio
export function initAudio(): AudioContext | null {
	try {
		const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		console.log('Audio context created');
		return audioContext;
	} catch (error) {
		console.error('Failed to create audio context:', error);
		return null;
	}
}

// Load piano samples
export async function loadPianoSamples(
	audioContext: AudioContext | null,
	onProgress: (progress: number) => void
): Promise<Record<string, AudioBuffer>> {
	if (!audioContext) return {};

	const pianoSamples: { [key: string]: AudioBuffer } = {};

	try {
		// Use static folder path (the samples were copied there)
		const sampleBaseUrl = '/audio/piano10/';

		// Get the number of samples we need to load
		const totalSamples = availableSamples.length;
		let loadedSamples = 0;

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
					const audioBuffer = await audioContext!.decodeAudioData(arrayBuffer);
					console.log(`Decoded audio for ${sampleFileName}: ${audioBuffer.duration} seconds`);
					pianoSamples[sampleFileName] = audioBuffer;
					loadedSamples++;
					onProgress(Math.floor((loadedSamples / totalSamples) * 100));
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
			return pianoSamples;
		} else {
			console.error('Failed to load any piano samples');
			return {};
		}
	} catch (error) {
		console.error('Error in loadPianoSamples:', error);
		return {};
	}
}

// Function to convert MIDI note number to frequency
export function midiToFrequency(midiNote: number): number {
	return 440 * Math.pow(2, (midiNote - 69) / 12);
}

// Find the closest sample for a given note
export function findClosestSample(midiNote: number): string {
	// Debug log for note detection
	const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
	const noteName = noteNames[midiNote % 12];
	const octave = Math.floor(midiNote / 12) - 1;
	console.log(`Finding sample for MIDI note ${midiNote}: ${noteName}${octave}`);

	// CRITICAL: First check if this exact MIDI note has a dedicated sample in our sampleMap
	if (sampleMap[midiNote]) {
		console.log(`Using exact sample match from sampleMap: ${sampleMap[midiNote]}`);
		return sampleMap[midiNote];
	}

	// ----- IMPORTANT -----
	// We only have samples for A, C, Ds, and Fs notes
	// We need to map other notes to these available samples with pitch shifting
	// ----- IMPORTANT -----

	// For each note, map it to one of our available sample types
	// The note type mapping strategy based on available samples
	const noteTypeMapping: {
		[key: string]: { type: string; octaveOffset: number; semitones: number };
	} = {
		// Note: type is the sample type to use, octaveOffset adjusts the octave, semitones is the pitch shift
		C: { type: 'C', octaveOffset: 0, semitones: 0 }, // Use C directly
		'C#': { type: 'C', octaveOffset: 0, semitones: 1 }, // Use C, shift up 1 semitone
		D: { type: 'Ds', octaveOffset: 0, semitones: -1 }, // Use Ds, shift down 1 semitone
		'D#': { type: 'Ds', octaveOffset: 0, semitones: 0 }, // Use Ds directly
		E: { type: 'Ds', octaveOffset: 0, semitones: 1 }, // Use Ds, shift up 1 semitone
		F: { type: 'Fs', octaveOffset: 0, semitones: -1 }, // Use Fs, shift down 1 semitone
		'F#': { type: 'Fs', octaveOffset: 0, semitones: 0 }, // Use Fs directly
		G: { type: 'Fs', octaveOffset: 0, semitones: 1 }, // Use Fs, shift up 1 semitone
		'G#': { type: 'A', octaveOffset: 0, semitones: -1 }, // Use A, shift down 1 semitone
		A: { type: 'A', octaveOffset: 0, semitones: 0 }, // Use A directly
		'A#': { type: 'A', octaveOffset: 0, semitones: 1 }, // Use A, shift up 1 semitone
		B: { type: 'A', octaveOffset: 0, semitones: 2 } // Use C from same octave, shift down 1
	};

	// Get mapping info for this note type
	const mapping = noteTypeMapping[noteName];
	if (!mapping) {
		console.error(`No mapping found for note ${noteName}`);
		return availableSamples[0]; // Fallback to first available sample
	}

	// Calculate target octave with any offsets
	const targetOctave = octave + mapping.octaveOffset;

	// Construct a complete filename with the sample type, octave and velocity
	// ALWAYS use the full filename format
	const sampleFilename = `${mapping.type}${targetOctave}v10.mp3`;

	// Check if this sample exists in our available samples list
	if (availableSamples.includes(sampleFilename)) {
		console.log(
			`Using mapped sample ${sampleFilename} for ${noteName}${octave} (MIDI ${midiNote}) with pitch shift ${mapping.semitones}`
		);
		return sampleFilename;
	}

	// If the exact octave sample isn't available, find closest octave for the same note type
	// First get all samples of this type
	const samplesOfType = availableSamples.filter(
		(sample) => sample.startsWith(mapping.type) && sample.endsWith('v10.mp3')
	);

	if (samplesOfType.length === 0) {
		// Fallback to A4 as a safe default if no samples of the desired type exist
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
		// Support both 's' and '#' in filenames for compatibility
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

// Function to get the semitone distance between MIDI numbers
export function getSemitoneDistance(midiNote: number, baseMidiNote: number): number {
	return midiNote - baseMidiNote;
}

// Play a note using piano samples or fallback to oscillator
export function playNote(
	midiNote: number,
	audioContext: AudioContext,
	pianoSamples: Record<string, AudioBuffer>,
	samplesLoaded: boolean
) {
	try {
		// Check if we have enough samples loaded
		if (samplesLoaded && Object.keys(pianoSamples).length > 0) {
			// Get the note information
			const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
			const noteName = noteNames[midiNote % 12];
			const octave = Math.floor(midiNote / 12) - 1;

			// Find the closest sample
			const sampleName = findClosestSample(midiNote);

			// Check if we actually have this sample loaded
			if (pianoSamples[sampleName]) {
				console.log(`Playing note ${midiNote} (${noteName}${octave}) using sample ${sampleName}`);

				// Create audio buffer source
				const source = audioContext.createBufferSource();
				source.buffer = pianoSamples[sampleName];

				// Calculate the correct pitch adjustment based on the mapping information
				// and the actual sample we're using

				// Get the note and octave from the sample filename
				// Support both 's' and '#' in filenames
				const match = sampleName.match(/([A-G][s#]?)(\d+)v/);
				if (!match) {
					console.error(`Invalid sample name format: ${sampleName}`);
					return createOscillator(midiNote, audioContext);
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
				// Allow more pitch shifting for B notes but limit others to +/- 4 semitones for optimal sound quality
				const maxAllowedShift = noteName === 'B' ? 12 : 4;

				// Use the oscillator for extreme shifts
				if (Math.abs(semitones) > maxAllowedShift) {
					console.log(
						`Excessive pitch shift (${semitones} semitones) for note ${midiNote}, using oscillator`
					);
					return createOscillator(midiNote, audioContext);
				}

				// Calculate the pitch ratio
				const ratio = Math.pow(2, semitones / 12);
				source.playbackRate.value = ratio;

				console.log(`Playback rate: ${ratio.toFixed(3)}`);

				// Create gain node for envelope
				const gainNode = audioContext.createGain();
				gainNode.gain.value = 0.0; // Start silent and ramp up

				// Connect nodes
				source.connect(gainNode);
				gainNode.connect(audioContext.destination);

				// Start playing
				source.start();

				// Apply envelope: fairly rapid attack, slow decay
				const now = audioContext.currentTime;

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
				console.warn(
					`Sample ${sampleName} not found for note ${midiNote}, falling back to oscillator`
				);
				return createOscillator(midiNote, audioContext);
			}
		} else {
			console.log(`Using oscillator for note ${midiNote} because samples not loaded`);
			return createOscillator(midiNote, audioContext);
		}
	} catch (error) {
		console.error('Error playing note:', error);
		return createOscillator(midiNote, audioContext); // Try oscillator as last resort
	}
}

// Calculate MIDI note number from note name and octave
export function calculateMidiFromName(noteName: string, octave: number): number {
	// Normalize both # and s notations to use # internally
	const normalizedName = normalizeSharpNotation(noteName);

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
		// Add flat equivalents
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

// Create and play oscillator for fallback
export function createOscillator(midiNote: number, audioContext: AudioContext) {
	try {
		// Convert MIDI note to frequency: 440 * 2^((midiNote - 69) / 12)
		// Ensure the note is within playable range (21-108)
		const clampedNote = Math.max(21, Math.min(108, midiNote));
		const frequency = 440 * Math.pow(2, (clampedNote - 69) / 12);

		// Safety check for valid frequency
		if (!isFinite(frequency)) {
			console.error(`Invalid frequency for MIDI note ${midiNote}, using default`);
			return null;
		}

		// Create oscillator
		const oscillator = audioContext.createOscillator();
		oscillator.type = 'sine';
		oscillator.frequency.value = frequency;

		// Create gain node for envelope
		const gainNode = audioContext.createGain();
		gainNode.gain.value = 0.2; // Lower volume for oscillator

		// Add sub oscillator for richer sound
		const subOscillator = audioContext.createOscillator();
		subOscillator.type = 'triangle';
		subOscillator.frequency.value = frequency / 2;

		const subGainNode = audioContext.createGain();
		subGainNode.gain.value = 0.1;

		// Connect everything
		oscillator.connect(gainNode);
		subOscillator.connect(subGainNode);
		gainNode.connect(audioContext.destination);
		subGainNode.connect(audioContext.destination);

		// Start oscillators
		oscillator.start();
		subOscillator.start();

		// Apply envelope
		const now = audioContext.currentTime;
		gainNode.gain.setValueAtTime(0, now);
		gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
		gainNode.gain.linearRampToValueAtTime(0.15, now + 0.3);
		gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

		subGainNode.gain.setValueAtTime(0, now);
		subGainNode.gain.linearRampToValueAtTime(0.1, now + 0.02);
		subGainNode.gain.linearRampToValueAtTime(0.08, now + 0.3);
		subGainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

		return { source: oscillator, gainNode, subOscillator, subGainNode };
	} catch (error) {
		console.error('Error creating oscillator:', error);
		return null;
	}
}

// Stop a note
export function stopNote(nodes: any) {
	if (!nodes) return;

	try {
		const now = nodes.source.context.currentTime || 0;

		// Gracefully fade out main oscillator/sample
		if (nodes.gainNode) {
			nodes.gainNode.gain.cancelScheduledValues(now);
			nodes.gainNode.gain.setValueAtTime(nodes.gainNode.gain.value, now);
			nodes.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

			// Stop the source after the fade out
			setTimeout(() => {
				try {
					if (nodes.source && nodes.source.stop) {
						nodes.source.stop();
					}
				} catch {
					// Ignore errors if already stopped
				}
			}, 100);
		}

		// Also fade out sub oscillator if it exists
		if (nodes.subGainNode) {
			nodes.subGainNode.gain.cancelScheduledValues(now);
			nodes.subGainNode.gain.setValueAtTime(nodes.subGainNode.gain.value, now);
			nodes.subGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

			// Stop the sub oscillator after the fade out
			setTimeout(() => {
				try {
					if (nodes.subOscillator && nodes.subOscillator.stop) {
						nodes.subOscillator.stop();
					}
				} catch {
					// Ignore errors if already stopped
				}
			}, 100);
		}
	} catch (error) {
		console.error('Error stopping note:', error);
	}
}

// Convert between sharp notations: D# <-> Ds
export function normalizeSharpNotation(noteName: string): string {
	// If we have s-style notation (Ds, Fs), convert to #-style (D#, F#)
	if (noteName.endsWith('s')) {
		return noteName.replace(/([A-G])s/, '$1#');
	}
	// If we have #-style notation, keep as is
	return noteName;
}

// Convert note name to our filename format (e.g., convert D# -> Ds for filenames)
export function noteToFilenameFormat(noteName: string): string {
	return noteName.replace('#', 's');
}

// Calculate MIDI note number from note name, accidental and octave
export function calculateNoteNumber(name: string, accidental: string, octave: number): number {
	// Base notes C to B in semitones from C
	const baseNotes: { [key: string]: number } = {
		C: 0,
		D: 2,
		E: 4,
		F: 5,
		G: 7,
		A: 9,
		B: 11
	};

	// Calculate semitones from middle C (C4 = 60)
	const noteSemitones = baseNotes[name.toUpperCase()];
	const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0;
	const octaveOffset = (octave - 4) * 12; // C4 is MIDI 60

	return 60 + octaveOffset + noteSemitones + accidentalOffset;
}
