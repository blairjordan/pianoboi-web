import { useEffect, useRef } from 'react';
import { Key } from '@tonaljs/tonal';
import { Accidental, Formatter, Renderer, Stave, StaveConnector, StaveNote, Voice } from 'vexflow';
import type { Signature } from '../types/signatures';
import { getNoteProperty } from '../utils/chords';

interface Props {
	notes?: any[];
	signature: Signature;
}

function keyAlterations(signature: Signature) {
	const alterations = new Map<string, string>();
	try {
		for (const note of Key.majorKey(signature.id).scale) {
			if (note.includes('#') || note.includes('b')) alterations.set(note[0].toLowerCase(), note[1]);
		}
	} catch (error) {
		console.error('Unable to read key signature', error);
	}
	return alterations;
}

function chordNote(clef: 'treble' | 'bass', notes: any[], signature: Signature) {
	if (!notes.length) return null;
	const isFlat = signature.flats > 0;
	const sharpToFlat: Record<string, [string, string]> = {
		'C#': ['D', 'b'],
		'D#': ['E', 'b'],
		'F#': ['G', 'b'],
		'G#': ['A', 'b'],
		'A#': ['B', 'b']
	};
	const flatToSharp: Record<string, [string, string]> = {
		Db: ['C', '#'],
		Eb: ['D', '#'],
		Gb: ['F', '#'],
		Ab: ['G', '#'],
		Bb: ['A', '#']
	};
	const normalized = notes.map((note) => {
		let name = getNoteProperty(note, 'name', 'C');
		let accidental = getNoteProperty(note, 'accidental', '');
		const replacement = isFlat ? sharpToFlat[name + accidental] : flatToSharp[name + accidental];
		if (replacement) [name, accidental] = replacement;
		return { name, accidental, octave: getNoteProperty(note, 'octave', 4) };
	});
	const staveNote = new StaveNote({
		keys: normalized.map(
			(note) => `${note.name[0].toLowerCase()}${note.accidental}/${note.octave}`
		),
		duration: 'w',
		clef
	});
	const alterations = keyAlterations(signature);
	normalized.forEach((note, index) => {
		const expected = alterations.get(note.name[0].toLowerCase()) || '';
		if (!expected && note.accidental) staveNote.addModifier(new Accidental(note.accidental), index);
		else if (expected && !note.accidental) staveNote.addModifier(new Accidental('n'), index);
		else if (expected && note.accidental !== expected)
			staveNote.addModifier(new Accidental(note.accidental), index);
	});
	return staveNote;
}

function wholeRest(clef: 'treble' | 'bass') {
	return new StaveNote({ clef, keys: [clef === 'treble' ? 'b/4' : 'd/3'], duration: 'wr' });
}

export default function SheetMusic({ notes = [], signature }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		const render = () => {
			try {
				container.innerHTML = '';
				const width = Math.max(container.clientWidth, 320);
				const renderer = new Renderer(container, Renderer.Backends.SVG);
				renderer.resize(width, 190);
				const context = renderer.getContext();
				const margin = 40;
				const staveWidth = Math.min(width - margin * 2, 350);
				const trebleStave = new Stave(margin, 10, staveWidth)
					.addClef('treble')
					.addKeySignature(signature.id);
				const bassStave = new Stave(margin, 80, staveWidth)
					.addClef('bass')
					.addKeySignature(signature.id);
				trebleStave.setContext(context).draw();
				bassStave.setContext(context).draw();
				new StaveConnector(trebleStave, bassStave)
					.setType(StaveConnector.type.BRACE)
					.setContext(context)
					.draw();
				const validNotes = [...notes]
					.filter(
						(note) => getNoteProperty(note, 'name') && getNoteProperty(note, 'octave') !== undefined
					)
					.sort((a, b) => getNoteProperty(a, 'number', 0) - getNoteProperty(b, 'number', 0));
				const treble = validNotes.filter((note) => getNoteProperty(note, 'octave', 0) >= 4);
				const bass = validNotes.filter((note) => getNoteProperty(note, 'octave', 0) < 4);
				const trebleVoice = new Voice({ numBeats: 1, beatValue: 1 }).addTickables([
					chordNote('treble', treble, signature) || wholeRest('treble')
				]);
				const bassVoice = new Voice({ numBeats: 1, beatValue: 1 }).addTickables([
					chordNote('bass', bass, signature) || wholeRest('bass')
				]);
				new Formatter().joinVoices([trebleVoice]).format([trebleVoice], staveWidth - 60);
				new Formatter().joinVoices([bassVoice]).format([bassVoice], staveWidth - 60);
				trebleVoice.draw(context, trebleStave);
				bassVoice.draw(context, bassStave);
			} catch (error) {
				console.error('Error rendering sheet music:', error);
			}
		};
		render();
		const observer = new ResizeObserver(render);
		observer.observe(container);
		return () => observer.disconnect();
	}, [notes, signature]);

	return <div ref={containerRef} className="sheet-music w-full" aria-label="Sheet music" />;
}
