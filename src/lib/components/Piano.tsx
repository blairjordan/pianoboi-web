import { useEffect, useMemo, useRef } from 'react';
import type { Signature } from '../types/signatures';

interface PianoProps {
	notes?: any[];
	readonly?: boolean;
	compact?: boolean;
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
	}, [compact]);

	const emit = (name: string, accidental: string, octave: number, isOn: boolean) => {
		if (!readonly) onNotePress?.({ name, accidental, octave, isOn });
	};

	return (
		<div className="piano-wrapper w-full overflow-hidden">
			<div
				ref={containerRef}
				className={`piano-keyboard flex overflow-x-auto pt-1 pb-2 select-none ${readonly ? 'pointer-events-none' : ''}`}
			>
				<div className={`flex min-w-max ${compact ? 'mx-auto' : ''}`}>
					{octaves.map((octave) => (
						<div className="relative flex" key={octave}>
							{naturalKeys.map((note) => {
								const keyId = `${note.toLowerCase()}${octave}`;
								return (
									<button
										key={keyId}
										type="button"
										aria-label={`${note}${octave}`}
										className={`white-key flex cursor-pointer items-end justify-center border border-gray-300 ${activeKeys.includes(keyId) ? 'active' : 'bg-white'} ${compact ? 'h-12 w-[0.65rem]' : 'h-32 w-[1.8rem] pb-2'}`}
										onMouseDown={() => emit(note, '', octave, true)}
										onMouseUp={() => emit(note, '', octave, false)}
										onMouseLeave={() => activeKeys.includes(keyId) && emit(note, '', octave, false)}
										onBlur={() => emit(note, '', octave, false)}
									>
										{!compact && showLabels && (
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
								const width = compact ? '0.42rem' : '1.1rem';
								const keyWidth = compact ? '0.65rem' : '1.8rem';
								const inset = compact ? '0.44rem' : '1.25rem';
								return (
									<button
										key={keyId}
										type="button"
										aria-label={`${displayNote}${octave}`}
										className={`black-key absolute top-0 z-10 cursor-pointer text-white ${activeKeys.includes(keyId) ? 'active' : 'bg-gray-800'} ${compact ? 'h-7' : 'h-20'}`}
										style={{ left: `calc(${offset} * ${keyWidth} + ${inset})`, width }}
										onMouseDown={() => emit(baseNote, accidental, octave, true)}
										onMouseUp={() => emit(baseNote, accidental, octave, false)}
										onMouseLeave={() =>
											activeKeys.includes(keyId) && emit(baseNote, accidental, octave, false)
										}
										onBlur={() => emit(baseNote, accidental, octave, false)}
									>
										{!compact && showLabels && (
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
