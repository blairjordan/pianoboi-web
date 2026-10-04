import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chord } from '@tonaljs/tonal';
import type { Input, NoteMessageEvent } from 'webmidi';
import type { PianoNote } from '../types/notes';
import type { Signature } from '../types/signatures';
import { signatures } from '../types/signatures';
import {
	calculateMidiFromName,
	calculateNoteNumber,
	initAudio,
	loadPianoSamples,
	playNote,
	stopNote
} from '../utils/audio';
import {
	assignChordToSet,
	createChordSet,
	deleteChordSet,
	extractPitchClasses,
	findMatchingChords,
	generateScaleChords,
	loadSavedChords,
	persistSavedChords,
	type ChordSet,
	type SavedChord
} from '../utils/chords';
import { startChordSequence } from '../utils/chordSequence';
import { disableWebMidi, initializeWebMidi, setupMidiListeners } from '../utils/midi';
import { createScratchpadApi } from '../utils/scratchpad';
import ChordDisplay from './ChordDisplay';
import ChordScaleReference from './ChordScaleReference';
import ChordSetManager from './ChordSetManager';
import KeySignatureSelector from './KeySignatureSelector';
import MidiDeviceSelector from './MidiDeviceSelector';
import Piano from './Piano';
import SavedChordsList from './SavedChordsList';
import Scratchpad from './Scratchpad';
import SheetMusic from './SheetMusic';
import ViewModeSwitcher from './ViewModeSwitcher';

type AudioNodes = ReturnType<typeof playNote>;

export default function PianoBoi() {
	const [midiEnabled, setMidiEnabled] = useState(false);
	const [midiInputs, setMidiInputs] = useState<Input[]>([]);
	const [selectedInput, setSelectedInput] = useState<Input | null>(null);
	const [activeNotes, setActiveNotes] = useState<PianoNote[]>([]);
	const [currentSignature, setCurrentSignature] = useState<Signature>(signatures[0]);
	const [midiError, setMidiError] = useState('');
	const [isInitializing, setIsInitializing] = useState(false);
	const [samplesLoaded, setSamplesLoaded] = useState(false);
	const [audioReady, setAudioReady] = useState(false);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [viewMode, setViewMode] = useState<'keyboard' | 'sheet'>('keyboard');
	const [showChordPanel, setShowChordPanel] = useState(
		() => localStorage.getItem('pianoboi-show-chord-panel') !== 'false'
	);
	const [isPianoCompact, setIsPianoCompact] = useState(
		() => localStorage.getItem('pianoboi-compact-piano') === 'true'
	);
	const [showScratchpad, setShowScratchpad] = useState(
		() => localStorage.getItem('pianoboi-show-scratchpad') === 'true'
	);
	const [savedChords, setSavedChords] = useState<SavedChord[]>([]);
	const [chordSets, setChordSets] = useState<ChordSet[]>([]);
	const [currentSetId, setCurrentSetId] = useState<string | null>(null);
	const [currentChordId, setCurrentChordIdState] = useState<string | null>(null);
	const [playingChordId, setPlayingChordId] = useState<string | null>(null);
	const [isPlayingAll, setIsPlayingAll] = useState(false);

	const chordsContainerRef = useRef<HTMLDivElement>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const pianoSamplesRef = useRef<Record<string, AudioBuffer>>({});
	const activeAudioNodesRef = useRef<Record<string, AudioNodes>>({});
	const playingAudioNodesRef = useRef<Array<{ note: number; nodes: AudioNodes }>>([]);
	const noteStartTimeoutsRef = useRef<number[]>([]);
	const cancelSequenceRef = useRef<(() => void) | null>(null);

	const scaleChords = useMemo(() => generateScaleChords(currentSignature), [currentSignature]);
	const matchingChords = useMemo(
		() => findMatchingChords(activeNotes, scaleChords),
		[activeNotes, scaleChords]
	);
	const currentChords = useMemo(
		() => Chord.detect(extractPitchClasses(activeNotes)),
		[activeNotes]
	);
	const visibleSavedChords = useMemo(
		() =>
			currentSetId ? savedChords.filter((chord) => chord.setId === currentSetId) : savedChords,
		[currentSetId, savedChords]
	);

	useEffect(() => {
		const api = createScratchpadApi();
		window.pianoboiScratchpad = api;
		return () => {
			if (window.pianoboiScratchpad === api) delete window.pianoboiScratchpad;
		};
	}, []);

	const initMidi = useCallback(async () => {
		setIsInitializing(true);
		const result = await initializeWebMidi();
		setMidiEnabled(result.midiEnabled);
		setMidiInputs(result.midiInputs);
		setMidiError(result.midiError);
		setSelectedInput((current) => {
			if (!current) return result.midiInputs[0] || null;
			return (
				result.midiInputs.find((input) => input.id === current.id || input.name === current.name) ||
				result.midiInputs[0] ||
				null
			);
		});
		setIsInitializing(false);
	}, []);

	const stopChordSound = useCallback(() => {
		noteStartTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
		noteStartTimeoutsRef.current = [];
		playingAudioNodesRef.current.forEach((item) => stopNote(item.nodes));
		playingAudioNodesRef.current = [];
		setPlayingChordId(null);
	}, []);

	const stopSequence = useCallback(() => {
		cancelSequenceRef.current?.();
		cancelSequenceRef.current = null;
		setIsPlayingAll(false);
		stopChordSound();
	}, [stopChordSound]);

	const clearActiveNotes = useCallback(() => {
		setActiveNotes([]);
		stopSequence();
		Object.values(activeAudioNodesRef.current).forEach(stopNote);
		activeAudioNodesRef.current = {};
	}, [stopSequence]);

	useEffect(() => {
		const loaded = loadSavedChords();
		setSavedChords(loaded.savedChords);
		setChordSets(loaded.chordSets);
		void initMidi();
		const audioContext = initAudio();
		audioContextRef.current = audioContext;
		if (audioContext) {
			void loadPianoSamples(audioContext, (progress) => {
				setLoadingProgress(progress);
				if (progress === 100) setSamplesLoaded(true);
			}).then((samples) => {
				pianoSamplesRef.current = samples;
				setSamplesLoaded(Object.keys(samples).length > 0);
				setAudioReady(true);
			});
		} else {
			setAudioReady(true);
		}
		return () => {
			disableWebMidi();
			cancelSequenceRef.current?.();
			Object.values(activeAudioNodesRef.current).forEach(stopNote);
			noteStartTimeoutsRef.current.forEach((timeout) => window.clearTimeout(timeout));
			playingAudioNodesRef.current.forEach((item) => stopNote(item.nodes));
			if (audioContextRef.current?.state !== 'closed') void audioContextRef.current?.close();
		};
	}, [initMidi]);

	useEffect(() => {
		if (!selectedInput) return;
		const noteOn = (event: NoteMessageEvent) => {
			const note: PianoNote = {
				name: event.note.name,
				accidental: event.note.accidental || '',
				octave: event.note.octave,
				number: event.note.number,
				identifier: `${event.note.name}${event.note.accidental || ''}${event.note.octave}`,
				attack: event.note.attack || 0.5,
				release: event.note.release || 0.5
			};
			setActiveNotes((notes) => [...notes.filter((item) => item.number !== note.number), note]);
		};
		const noteOff = (event: NoteMessageEvent) => {
			setActiveNotes((notes) => notes.filter((note) => note.number !== event.note.number));
		};
		setupMidiListeners(selectedInput, noteOn, noteOff);
		return () => {
			try {
				selectedInput.removeListener('noteon');
				selectedInput.removeListener('noteoff');
			} catch (error) {
				console.warn('Unable to remove MIDI listeners', error);
			}
		};
	}, [selectedInput]);

	const handlePianoNotePress = ({
		name,
		accidental,
		octave,
		isOn
	}: {
		name: string;
		accidental: string;
		octave: number;
		isOn: boolean;
	}) => {
		const normalizedName = name.toUpperCase();
		const identifier = `${normalizedName}${accidental}${octave}`;
		if (isOn) {
			const note: PianoNote = {
				name: normalizedName,
				accidental,
				octave,
				number: calculateNoteNumber(normalizedName, accidental, octave),
				identifier,
				attack: 0.5,
				release: 0.5
			};
			setActiveNotes((notes) => [...notes.filter((item) => item.identifier !== identifier), note]);
			const audioContext = audioContextRef.current;
			if (audioContext) {
				if (audioContext.state === 'suspended') void audioContext.resume();
				const nodes = playNote(note.number, audioContext, pianoSamplesRef.current, samplesLoaded);
				if (nodes) activeAudioNodesRef.current[identifier] = nodes;
			}
		} else {
			stopNote(activeAudioNodesRef.current[identifier]);
			delete activeAudioNodesRef.current[identifier];
			setActiveNotes((notes) => notes.filter((note) => note.identifier !== identifier));
		}
	};

	const setCurrentChord = useCallback((id: string | null) => {
		setCurrentChordIdState(id);
		window.setTimeout(() => {
			if (!id) return;
			const markerId = id === 'top' ? 'insert-marker-top' : `insert-marker-${id}`;
			document.getElementById(markerId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			if (id !== 'top') {
				const chordElement = document.getElementById(id);
				if (chordElement) {
					chordElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
					chordElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
					window.setTimeout(
						() => chordElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50'),
						1500
					);
				}
			}
		}, 50);
	}, []);

	const saveCurrentChord = useCallback(() => {
		if (!activeNotes.length) return;
		const newChord: SavedChord = {
			id: `chord-${Date.now()}`,
			notes: activeNotes.map((note) => ({ ...note, signature: currentSignature })),
			signature: currentSignature,
			timestamp: Date.now(),
			setId: currentSetId
		};
		setSavedChords((current) => {
			let updated: SavedChord[];
			if (currentChordId === 'top') updated = [newChord, ...current];
			else if (currentChordId) {
				const index = current.findIndex((chord) => chord.id === currentChordId);
				updated = [...current];
				if (index >= 0) updated.splice(index + 1, 0, newChord);
				else updated.push(newChord);
			} else updated = [...current, newChord];
			persistSavedChords(updated, chordSets);
			return updated;
		});
		setCurrentChord(newChord.id);
	}, [activeNotes, chordSets, currentChordId, currentSetId, currentSignature, setCurrentChord]);

	const playChordSound = useCallback(
		(chord: SavedChord) => {
			stopChordSound();
			setPlayingChordId(chord.id);
			const audioContext = audioContextRef.current;
			if (!audioContext) {
				return;
			}
			if (audioContext.state === 'suspended') void audioContext.resume();
			chord.notes.forEach((note, index) => {
				const timeout = window.setTimeout(() => {
					let midiNote =
						typeof note === 'number'
							? note
							: (note.number ??
								calculateMidiFromName(`${note.name}${note.accidental || ''}`, note.octave));
					midiNote = Math.max(21, Math.min(108, midiNote));
					const nodes = playNote(midiNote, audioContext, pianoSamplesRef.current, samplesLoaded);
					if (nodes) playingAudioNodesRef.current.push({ note: midiNote, nodes });
					noteStartTimeoutsRef.current = noteStartTimeoutsRef.current.filter(
						(item) => item !== timeout
					);
				}, index * 10);
				noteStartTimeoutsRef.current.push(timeout);
			});
		},
		[samplesLoaded, stopChordSound]
	);

	const playChord = useCallback(
		(chord: SavedChord) => {
			stopSequence();
			playChordSound(chord);
		},
		[playChordSound, stopSequence]
	);

	const playAllChords = useCallback(() => {
		if (!visibleSavedChords.length) return;
		stopSequence();
		const sequence = [...visibleSavedChords];
		setIsPlayingAll(true);
		cancelSequenceRef.current = startChordSequence(sequence, playChordSound, () => {
			cancelSequenceRef.current = null;
			setIsPlayingAll(false);
			stopChordSound();
		});
	}, [playChordSound, stopChordSound, stopSequence, visibleSavedChords]);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === 'Space' && !event.repeat) {
				event.preventDefault();
				saveCurrentChord();
			}
			if (event.code === 'KeyP' && !event.repeat && savedChords.length) {
				event.preventDefault();
				playChord(savedChords[savedChords.length - 1]);
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [playChord, saveCurrentChord, savedChords]);

	const persist = (nextChords: SavedChord[], nextSets = chordSets) => {
		setSavedChords(nextChords);
		persistSavedChords(nextChords, nextSets);
	};

	const toggleChordPanel = () => {
		setShowChordPanel((isVisible) => {
			const nextValue = !isVisible;
			localStorage.setItem('pianoboi-show-chord-panel', String(nextValue));
			return nextValue;
		});
	};

	const togglePianoSize = () => {
		setIsPianoCompact((isCompact) => {
			const nextValue = !isCompact;
			localStorage.setItem('pianoboi-compact-piano', String(nextValue));
			return nextValue;
		});
	};

	const setScratchpadVisible = (isVisible: boolean) => {
		setShowScratchpad(isVisible);
		localStorage.setItem('pianoboi-show-scratchpad', String(isVisible));
	};

	return (
		<div className="flex h-screen flex-col">
			<header className="sticky top-0 z-30 bg-white shadow-md">
				<div className="container mx-auto p-2">
					<div className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-2">
							<ViewModeSwitcher viewMode={viewMode} onChange={setViewMode} />
							<KeySignatureSelector
								currentSignature={currentSignature}
								onSelect={setCurrentSignature}
							/>
							<ChordSetManager
								chordSets={chordSets}
								currentSetId={currentSetId}
								savedChordCount={savedChords.length}
								onSelect={(setId) => {
									stopSequence();
									setCurrentSetId(setId);
								}}
								onDelete={(setId) => {
									const result = deleteChordSet(setId, chordSets, savedChords, currentSetId);
									setChordSets(result.updatedSets);
									stopSequence();
									setCurrentSetId(result.newCurrentSetId);
									persist(result.updatedChords, result.updatedSets);
								}}
								onCreate={(name) => {
									const result = createChordSet(name, chordSets);
									setChordSets(result.updatedSets);
									stopSequence();
									setCurrentSetId(result.newSet.id);
									persistSavedChords(savedChords, result.updatedSets);
								}}
							/>
						</div>
						<div className="flex items-center gap-2">
							<button
								type="button"
								className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium shadow-sm ${
									showScratchpad
										? 'border-blue-300 bg-blue-50 text-blue-700'
										: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
								}`}
								onClick={() => setScratchpadVisible(!showScratchpad)}
								aria-expanded={showScratchpad}
								aria-controls="learning-scratchpad"
							>
								<i className="fas fa-note-sticky" />
								Scratchpad
							</button>
							<MidiDeviceSelector
								midiEnabled={midiEnabled}
								midiInputs={midiInputs}
								selectedInput={selectedInput}
								midiError={midiError}
								isInitializing={isInitializing}
								onSelect={setSelectedInput}
								onRefresh={() => {
									setSelectedInput(null);
									setActiveNotes([]);
									void initMidi();
								}}
							/>
						</div>
					</div>
				</div>
			</header>

			<div className="relative flex flex-1 overflow-hidden">
				<div className="flex-1 overflow-hidden">
					<div
						ref={chordsContainerRef}
						className="h-full overflow-y-auto pb-[240px]"
						id="chord-container"
					>
						<SavedChordsList
							chords={savedChords}
							chordSets={chordSets}
							currentSetId={currentSetId}
							currentChordId={currentChordId}
							playingChordId={playingChordId}
							isPlayingAll={isPlayingAll}
							viewMode={viewMode}
							onSetCurrentChord={setCurrentChord}
							onDeleteChord={(id) => {
								if (playingChordId === id) stopSequence();
								persist(savedChords.filter((chord) => chord.id !== id));
								clearActiveNotes();
								if (currentChordId === id) setCurrentChordIdState(null);
							}}
							onPlayChord={playChord}
							onPlayAll={playAllChords}
							onStopAll={stopSequence}
							onAssignToSet={(chordId, setId) =>
								persist(assignChordToSet(chordId, setId, savedChords))
							}
							onClearChords={(setId) => {
								persist(setId ? savedChords.filter((chord) => chord.setId !== setId) : []);
								stopSequence();
								setCurrentChordIdState(null);
							}}
						/>
					</div>
				</div>
				{showScratchpad && (
					<div id="learning-scratchpad" className="contents">
						<Scratchpad onClose={() => setScratchpadVisible(false)} />
					</div>
				)}
			</div>

			<button
				type="button"
				className="focus-icon"
				onClick={() => {
					if (currentChordId) {
						const markerId =
							currentChordId === 'top' ? 'insert-marker-top' : `insert-marker-${currentChordId}`;
						document
							.getElementById(markerId)
							?.scrollIntoView({ behavior: 'smooth', block: 'center' });
					} else if (chordsContainerRef.current) {
						chordsContainerRef.current.scrollTop = chordsContainerRef.current.scrollHeight;
					}
				}}
				aria-label="Focus on current insertion point"
			>
				<i className="fas fa-crosshairs text-xl" />
			</button>

			<div className="sticky bottom-0 z-20 border-t bg-white pt-1 pb-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
				<div className="container mx-auto px-4">
					<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
						<div className="flex flex-wrap items-center gap-2">
							<button
								type="button"
								className="flex items-center gap-1 rounded-lg bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-sm transition-all duration-150 hover:bg-blue-600 active:scale-95"
								onClick={saveCurrentChord}
								title="Save the current chord (Space)"
							>
								<i className="fas fa-save" />
								<span className="ml-1">Save Chord</span>
								<span className="ml-1 rounded bg-blue-600/80 px-1 py-0.5">Space</span>
							</button>
							<button
								type="button"
								className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
								onClick={toggleChordPanel}
								aria-expanded={showChordPanel}
								aria-controls="chord-panel"
							>
								<i className={`fas ${showChordPanel ? 'fa-eye-slash' : 'fa-eye'}`} />
								{showChordPanel ? 'Hide Chords' : 'Show Chords'}
							</button>
							<button
								type="button"
								className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
								onClick={togglePianoSize}
								title={isPianoCompact ? 'Restore the full-size piano' : 'Use a smaller piano'}
							>
								<i className={`fas ${isPianoCompact ? 'fa-expand' : 'fa-compress'}`} />
								{isPianoCompact ? 'Full Piano' : 'Compact Piano'}
							</button>
						</div>
						{currentChordId ? (
							<div className="flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
								<span>
									{currentChordId === 'top' ? 'Adding at beginning' : 'Adding after selected chord'}
								</span>
								<button
									type="button"
									className="ml-1 rounded-full bg-blue-100 p-1"
									onClick={() => setCurrentChord(null)}
								>
									<i className="fas fa-times text-xs" />
								</button>
							</div>
						) : (
							<div className="text-xs text-gray-500">Adding at end</div>
						)}
						<span className="flex items-center text-xs font-medium text-gray-600">
							<span
								className={`mr-2 inline-block h-2 w-2 rounded-full ${activeNotes.length ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
							/>
							{activeNotes.length ? `${activeNotes.length} notes playing` : 'No notes playing'}
						</span>
					</div>
					{showChordPanel && (
						<div id="chord-panel" className="mb-2 min-h-[70px] border-b pb-2">
							<div className="flex flex-col gap-2 sm:flex-row">
								<div className="flex-1">
									<SheetMusic notes={activeNotes} signature={currentSignature} />
									<ChordDisplay notes={activeNotes} signature={currentSignature} />
								</div>
								<ChordScaleReference
									signature={currentSignature}
									notes={activeNotes}
									detectedChords={currentChords}
									matchingChords={matchingChords}
								/>
							</div>
						</div>
					)}
					<Piano
						notes={activeNotes}
						overview={isPianoCompact}
						showLabels
						signature={currentSignature}
						onNotePress={handlePianoNotePress}
					/>
					<div className="mt-1 border-t pt-1 text-center text-xs text-gray-500">
						{audioReady ? (
							<p>
								Keyboard shortcuts:{' '}
								<span className="mx-1 rounded bg-gray-200 px-1 py-0.5 font-mono">Space</span> to
								save chord,{' '}
								<span className="mx-1 rounded bg-gray-200 px-1 py-0.5 font-mono">P</span> to play
								most recent chord
							</p>
						) : (
							<div className="flex flex-col items-center">
								<p className="mb-0.5">Loading piano samples: {loadingProgress}%</p>
								<div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
									<div
										className="h-full rounded-full bg-blue-500"
										style={{ width: `${loadingProgress}%` }}
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
