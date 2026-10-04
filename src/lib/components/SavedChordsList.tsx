import type { ChordSet, SavedChord } from '../utils/chords';
import { findMatchingChords, generateScaleChords } from '../utils/chords';
import ChordDisplay from './ChordDisplay';
import ChordScaleReference from './ChordScaleReference';
import Piano from './Piano';
import SheetMusic from './SheetMusic';

interface Props {
	chords: SavedChord[];
	chordSets: ChordSet[];
	currentSetId: string | null;
	currentChordId: string | null;
	playingChordId: string | null;
	viewMode: 'keyboard' | 'sheet';
	onSetCurrentChord: (id: string | null) => void;
	onDeleteChord: (id: string) => void;
	onPlayChord: (chord: SavedChord) => void;
	onAssignToSet: (chordId: string, setId: string | null) => void;
	onClearChords: (setId: string | null) => void;
}

export default function SavedChordsList({
	chords,
	chordSets,
	currentSetId,
	currentChordId,
	playingChordId,
	viewMode,
	onSetCurrentChord,
	onDeleteChord,
	onPlayChord,
	onAssignToSet,
	onClearChords
}: Props) {
	const filteredChords = currentSetId
		? chords.filter((chord) => chord.setId === currentSetId)
		: chords;
	const currentSetName = currentSetId
		? chordSets.find((set) => set.id === currentSetId)?.name || 'Unnamed Set'
		: 'All Chords';

	if (!filteredChords.length) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="text-center text-gray-500">
					<p className="mb-1 text-base font-medium">No saved chords</p>
					<p className="text-xs">Press the space bar to save your current chord</p>
				</div>
			</div>
		);
	}

	const marker = (id: string) => (
		<div
			id={id === 'top' ? 'insert-marker-top' : `insert-marker-${id}`}
			className={`insertion-marker relative my-1 items-center justify-center ${
				currentChordId === id ? 'flex' : 'hidden'
			}`}
		>
			<div className="h-[2px] w-full rounded bg-blue-200" />
			<button
				type="button"
				className="absolute top-1/2 left-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm hover:bg-blue-50"
				onClick={() => onSetCurrentChord(id)}
				aria-label="Insert chord here"
			>
				<i className="fas fa-plus text-blue-500" />
			</button>
		</div>
	);

	return (
		<div className="space-y-2 p-2">
			<div className="flex items-center justify-between">
				<h2 className="text-base font-bold text-gray-800">
					{currentSetName} ({filteredChords.length}{' '}
					{filteredChords.length === 1 ? 'chord' : 'chords'})
				</h2>
				<button
					type="button"
					className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-600"
					onClick={() => onClearChords(currentSetId)}
				>
					Clear {currentSetId ? 'Set' : 'All'}
				</button>
			</div>
			{marker('top')}
			{filteredChords.map((chord) => {
				const setName = chord.setId
					? chordSets.find((set) => set.id === chord.setId)?.name || 'Unknown'
					: null;
				return (
					<div key={chord.id}>
						<div
							id={chord.id}
							className={`relative rounded-lg border p-2 shadow-sm transition-all duration-300 hover:shadow ${
								playingChordId === chord.id ? 'bg-blue-50' : 'bg-white'
							}`}
						>
							<div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
								<div>
									Key: <span className="font-medium text-gray-700">{chord.signature.id}</span>
								</div>
								{setName ? (
									<span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">
										In Set: {setName}
									</span>
								) : currentSetId ? (
									<button
										type="button"
										className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-gray-600 hover:bg-blue-100 hover:text-blue-700"
										onClick={() => onAssignToSet(chord.id, currentSetId)}
									>
										<i className="fas fa-plus mr-1" /> Add to set
									</button>
								) : null}
							</div>
							<button
								type="button"
								className="absolute top-1 right-2 text-gray-400 hover:text-red-500"
								onClick={() => onDeleteChord(chord.id)}
								aria-label="Delete chord"
							>
								<i className="fas fa-times" />
							</button>
							<div className="flex w-full">
								<div className="flex-1 overflow-hidden">
									{viewMode === 'keyboard' ? (
										<div className="overflow-x-auto">
											<Piano
												notes={chord.notes}
												readonly
												compact
												showLabels
												signature={chord.signature}
											/>
										</div>
									) : (
										<div className="flex flex-col gap-2 sm:flex-row">
											<div className="flex-1">
												<SheetMusic notes={chord.notes} signature={chord.signature} />
											</div>
											<div className="flex flex-1 flex-col gap-2">
												<ChordDisplay notes={chord.notes} signature={chord.signature} />
												<ChordScaleReference
													signature={chord.signature}
													notes={chord.notes}
													matchingChords={findMatchingChords(
														chord.notes,
														generateScaleChords(chord.signature)
													)}
													hasInfoButton={false}
												/>
											</div>
										</div>
									)}
								</div>
							</div>
							<button
								type="button"
								className={`absolute right-2 bottom-2 mx-1 my-1 flex items-center rounded-full bg-blue-500 px-2 py-1 text-white transition-colors hover:bg-blue-600 ${
									playingChordId === chord.id ? 'animate-pulse' : ''
								}`}
								onClick={() => onPlayChord(chord)}
							>
								<i className="fas fa-play mr-1 text-xs" />
								<span className="text-xs">Play</span>
							</button>
						</div>
						{marker(chord.id)}
					</div>
				);
			})}
		</div>
	);
}
