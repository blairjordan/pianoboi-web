import { useMemo } from 'react';
import type { Signature } from '../types/signatures';
import { extractPitchClasses } from '../utils/chords';

interface Props {
	notes?: any[];
	signature: Signature;
	debug?: boolean;
}

export default function ChordDisplay({ notes = [], debug = false }: Props) {
	const pitchClasses = useMemo(() => extractPitchClasses(notes), [notes]);
	return (
		<div className="rounded-lg border bg-white p-2 shadow-sm">
			<div className="text-xs">
				<div className="mb-1 flex items-center justify-between">
					<h3 className="font-medium text-gray-700">Current Notes</h3>
					{debug && <span className="text-gray-500">{pitchClasses.join(', ')}</span>}
				</div>
				{notes.length ? (
					<div className="mt-1 flex flex-wrap gap-1">
						{pitchClasses.map((note) => (
							<span
								key={note}
								className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800"
							>
								{note}
							</span>
						))}
					</div>
				) : (
					<p className="mt-1 text-xs leading-5 text-gray-500">
						No notes detected. Play some notes to see them here.
					</p>
				)}
			</div>
		</div>
	);
}
