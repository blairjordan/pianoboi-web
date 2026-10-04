import { FormEvent, useState } from 'react';
import type { ChordSet } from '../utils/chords';

interface Props {
	chordSets: ChordSet[];
	currentSetId: string | null;
	savedChordCount: number;
	onSelect: (setId: string | null) => void;
	onDelete: (setId: string) => void;
	onCreate: (name: string) => void;
}

export default function ChordSetManager({
	chordSets,
	currentSetId,
	savedChordCount,
	onSelect,
	onDelete,
	onCreate
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	const [newSetName, setNewSetName] = useState('');
	const currentSetName = currentSetId
		? chordSets.find((set) => set.id === currentSetId)?.name || 'Unnamed Set'
		: 'All Chords';
	const create = (event: FormEvent) => {
		event.preventDefault();
		if (!newSetName.trim()) return;
		onCreate(newSetName.trim());
		setNewSetName('');
		setIsOpen(false);
	};

	return (
		<div className="relative">
			<button
				type="button"
				className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs font-medium shadow-sm hover:bg-gray-50"
				onClick={() => setIsOpen((open) => !open)}
			>
				<i className="fas fa-folder text-blue-600" />
				<span className="font-medium text-gray-700">Set:</span>
				<span className="ml-1 text-blue-600">{currentSetName}</span>
				<i className="fas fa-chevron-down ml-1 text-[10px]" />
			</button>
			{isOpen && (
				<div className="absolute top-full left-0 z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
					<div className="mb-1 border-b pb-1 text-xs font-medium text-gray-700">Chord Sets</div>
					<div className="mb-2 max-h-52 overflow-y-auto">
						<button
							type="button"
							className={`mb-1 flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-xs hover:bg-blue-50 ${
								currentSetId === null ? 'bg-blue-100' : ''
							}`}
							onClick={() => {
								onSelect(null);
								setIsOpen(false);
							}}
						>
							<span className="font-medium">All Chords</span>
							<span className="text-gray-500">{savedChordCount} chords</span>
						</button>
						{chordSets.map((set) => (
							<div
								key={set.id}
								className={`flex w-full items-center justify-between rounded-md px-1 py-0.5 hover:bg-blue-50 ${
									currentSetId === set.id ? 'bg-blue-100' : ''
								}`}
							>
								<button
									type="button"
									className="flex-1 px-2 py-0.5 text-left text-xs"
									onClick={() => {
										onSelect(set.id);
										setIsOpen(false);
									}}
								>
									<span className="font-medium">{set.name}</span>
								</button>
								<button
									type="button"
									className="ml-1 rounded p-0.5 text-red-400 hover:bg-red-50 hover:text-red-600"
									onClick={() => onDelete(set.id)}
									aria-label={`Delete ${set.name}`}
								>
									<i className="fas fa-trash text-xs" />
								</button>
							</div>
						))}
					</div>
					<form className="flex items-center border-t pt-1" onSubmit={create}>
						<input
							type="text"
							value={newSetName}
							onChange={(event) => setNewSetName(event.target.value)}
							placeholder="New set name..."
							className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs shadow-sm"
						/>
						<button
							type="submit"
							disabled={!newSetName.trim()}
							className="ml-1 rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-600 disabled:opacity-50"
						>
							Create
						</button>
					</form>
				</div>
			)}
		</div>
	);
}
