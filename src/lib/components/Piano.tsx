import { useEffect, useMemo, useRef } from 'react';
import type { Signature } from '../types/signatures';

interface PianoProps {
	notes?: any[];
	readonly?: boolean;
	compact?: boolean;
	overview?: boolean;
	showLabels?: boolean;
	signature: Signature;
	onNotePress?: (note: { name: string; accidental: string; octave: number; isOn: boolean }) => void;
}

const octaves = [1, 2, 3, 4, 5, 6, 7];
const naturalKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const blackKeyPositions = [
	{ note: 'C', offset: 0 },
	{ note: 'D', offset: 1 },
	{ note: 'F', offset: 3 },
	{ note: 'G', offset: 4 },
	{ note: 'A', offset: 5 }
];
const chromaticNotes = [
	{ name: 'C', accidental: '', isAccidental: false },
	{ name: 'C', accidental: '#', isAccidental: true },
	{ name: 'D', accidental: '', isAccidental: false },
	{ name: 'D', accidental: '#', isAccidental: true },
	{ name: 'E', accidental: '', isAccidental: false },
	{ name: 'F', accidental: '', isAccidental: false },
	{ name: 'F', accidental: '#', isAccidental: true },
	{ name: 'G', accidental: '', isAccidental: false },
	{ name: 'G', accidental: '#', isAccidental: true },
	{ name: 'A', accidental: '', isAccidental: false },
	{ name: 'A', accidental: '#', isAccidental: true },
	{ name: 'B', accidental: '', isAccidental: false }
];
const flatKeyMapping: Record<string, string> = {
	'C#': 'Db',
	'D#': 'Eb',
	'F#': 'Gb',
	'G#': 'Ab',
	'A#': 'Bb'
};

export default function Piano({
	notes = [],
	readonly = false,
	compact = false,
	overview = false,
	showLabels = false,
	signature,
	onNotePress
}: PianoProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isFlatKey = signature.flats > 0;
	const activeKeys = useMemo(
		() =>
			notes
				.map((note) => {
					const name = (note.name || note._name || '').toLowerCase();
					const accidental = note.accidental || note._accidental || '';
					const octave = note.octave ?? note._octave;
					const sharpToFlat: Record<string, string> = {
						'c#': 'db',
						'd#': 'eb',
						'f#': 'gb',
						'g#': 'ab',
						'a#': 'bb'
					};
					const flatToSharp: Record<string, string> = {
						db: 'c#',
						eb: 'd#',
						gb: 'f#',
						ab: 'g#',
						bb: 'a#'
					};
					const normalized = isFlatKey
						? sharpToFlat[name + accidental] || name + accidental
						: flatToSharp[name + accidental] || name + accidental;
					return `${normalized}${octave}`;
				})
				.filter(Boolean),
		[isFlatKey, notes]
	);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const frame = window.requestAnimationFrame(() => {
			container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
		});
		return () => window.cancelAnimationFrame(frame);
	}, [compact, overview]);

	const emit = (name: string, accidental: string, octave: number, isOn: boolean) => {
		if (!readonly) onNotePress?.({ name, accidental, octave, isOn });
	};

	if (overview) {
		const ribbonNotes = octaves.flatMap((octave) =>
			chromaticNotes.map((note, pitchClassIndex) => {
				const sharpName = `${note.name}${note.accidental}`;
				const displayName = isFlatKey && note.isAccidental ? flatKeyMapping[sharpName] : sharpName;
				const name = isFlatKey && note.isAccidental ? displayName[0] : note.name;
				const accidental = isFlatKey && note.isAccidental ? 'b' : note.accidental;
				return {
					...note,
					name,
					accidental,
					displayName,
					octave,
					pitchClassIndex,
					keyId: `${name.toLowerCase()}${accidental}${octave}`
				};
			})
		);

		return (
			<div className="w-full px-1 py-1" data-testid="pitch-ribbon">
				<div
					className="grid h-9 w-full gap-px overflow-hidden rounded-lg border border-slate-300 bg-slate-300 p-px shadow-inner"
					style={{ gridTemplateColumns: `repeat(${ribbonNotes.length}, minmax(0, 1fr))` }}
					aria-label="Compact chromatic pitch ribbon"
				>
					{ribbonNotes.map((note) => {
						const isActive = activeKeys.includes(note.keyId);
						return (
							<button
								key={note.keyId}
								type="button"
								aria-label={`${note.displayName}${note.octave}`}
								className={`relative min-w-0 transition-all duration-75 hover:brightness-110 ${
									note.name === 'C' && !note.accidental ? 'border-l-2 border-l-blue-300' : ''
								} ${
									isActive
										? 'z-10 scale-y-110 shadow-[0_0_8px_rgba(59,130,246,0.85)] outline outline-1 outline-white'
										: 'opacity-75'
								}`}
								style={{
									backgroundColor: `hsl(${note.pitchClassIndex * 30} ${isActive ? 82 : 42}% ${
										isActive ? 52 : note.isAccidental ? 62 : 76
									}%)`
								}}
								onMouseDown={() => emit(note.name, note.accidental, note.octave, true)}
								onMouseUp={() => emit(note.name, note.accidental, note.octave, false)}
								onMouseLeave={() =>
									isActive && emit(note.name, note.accidental, note.octave, false)
								}
								onBlur={() => emit(note.name, note.accidental, note.octave, false)}
							/>
						);
					})}
				</div>
				<div className="mt-0.5 flex justify-between px-0.5 text-[0.6rem] font-medium tracking-wide text-slate-400 uppercase">
					<span>Low</span>
					<span>{activeKeys.length ? `${activeKeys.length} active` : 'Pitch ribbon'}</span>
					<span>High</span>
				</div>
			</div>
		);
	}

	return (
		<div className="piano-wrapper w-full overflow-hidden">
			<div
				ref={containerRef}
				className={`piano-keyboard flex overflow-x-auto pt-1 pb-2 select-none ${readonly ? 'pointer-events-none' : ''}`}
			>
				<div className="flex min-w-max">
					{octaves.map((octave) => (
						<div className="relative flex" key={octave}>
							{naturalKeys.map((note) => {
								const keyId = `${note.toLowerCase()}${octave}`;
								return (
									<button
										key={keyId}
										type="button"
										aria-label={`${note}${octave}`}
										className={`white-key flex cursor-pointer items-end justify-center border border-gray-300 ${activeKeys.includes(keyId) ? 'active' : 'bg-white'} ${compact ? 'h-20 w-[1.4rem] pb-2' : 'h-32 w-[1.8rem] pb-2'}`}
										onMouseDown={() => emit(note, '', octave, true)}
										onMouseUp={() => emit(note, '', octave, false)}
										onMouseLeave={() => activeKeys.includes(keyId) && emit(note, '', octave, false)}
										onBlur={() => emit(note, '', octave, false)}
									>
										{showLabels && (
											<span className="text-xs font-semibold text-gray-400">{note}</span>
										)}
									</button>
								);
							})}
							{blackKeyPositions.map(({ note, offset }) => {
								const sharpNote = `${note}#`;
								const displayNote = isFlatKey ? flatKeyMapping[sharpNote] : sharpNote;
								const accidental = isFlatKey ? 'b' : '#';
								const baseNote = isFlatKey ? displayNote[0] : note;
								const keyId = `${baseNote.toLowerCase()}${accidental}${octave}`;
								const width = compact ? '0.9rem' : '1.1rem';
								const keyWidth = compact ? '1.4rem' : '1.8rem';
								const inset = compact ? '0.95rem' : '1.25rem';
								return (
									<button
										key={keyId}
										type="button"
										aria-label={`${displayNote}${octave}`}
										className={`black-key absolute top-0 z-10 cursor-pointer text-white ${activeKeys.includes(keyId) ? 'active' : 'bg-gray-800'} ${compact ? 'h-12' : 'h-20'}`}
										style={{ left: `calc(${offset} * ${keyWidth} + ${inset})`, width }}
										onMouseDown={() => emit(baseNote, accidental, octave, true)}
										onMouseUp={() => emit(baseNote, accidental, octave, false)}
										onMouseLeave={() =>
											activeKeys.includes(keyId) && emit(baseNote, accidental, octave, false)
										}
										onBlur={() => emit(baseNote, accidental, octave, false)}
									>
										{showLabels && (
											<span className="absolute right-0 bottom-2 left-0 text-center text-[0.6rem] font-medium">
												{displayNote}
											</span>
										)}
									</button>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
