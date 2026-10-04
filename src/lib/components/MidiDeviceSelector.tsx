import { useState } from 'react';
import type { Input } from 'webmidi';

interface Props {
	midiEnabled: boolean;
	midiInputs: Input[];
	selectedInput: Input | null;
	midiError: string;
	isInitializing: boolean;
	onSelect: (input: Input) => void;
	onRefresh: () => void;
}

export default function MidiDeviceSelector({
	midiEnabled,
	midiInputs,
	selectedInput,
	midiError,
	isInitializing,
	onSelect,
	onRefresh
}: Props) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="relative">
			<button
				type="button"
				className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs font-medium shadow-sm hover:bg-gray-50"
				onClick={() => setIsOpen((open) => !open)}
			>
				<i className="fas fa-plug text-blue-600" />
				{selectedInput?.name || 'Select MIDI Device'}
				<i className="fas fa-chevron-down ml-1 text-[10px]" />
			</button>
			{isOpen && (
				<div className="dropdown-menu absolute right-0 z-[9999] mt-1 w-52 rounded-md border border-gray-200 bg-white shadow-lg">
					<div className="p-2">
						<div className="mb-1 flex justify-between border-b pb-1">
							<span className="text-xs font-medium text-gray-700">MIDI Devices</span>
							<button
								type="button"
								className="text-xs text-blue-600 hover:text-blue-800"
								onClick={onRefresh}
								disabled={isInitializing}
							>
								{isInitializing ? 'Refreshing...' : 'Refresh Devices'}
							</button>
						</div>
						{midiInputs.length === 0 ? (
							<div className="py-1 text-center text-xs text-gray-500">No MIDI devices found</div>
						) : (
							<div className="max-h-36 overflow-y-auto py-1">
								{midiInputs.map((input) => (
									<button
										key={input.id}
										type="button"
										className={`flex w-full items-center rounded px-2 py-1 text-left text-xs hover:bg-gray-100 ${
											selectedInput === input ? 'bg-blue-50 font-medium text-blue-700' : ''
										}`}
										onClick={() => {
											onSelect(input);
											setIsOpen(false);
										}}
									>
										{input.name}
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
			{!midiEnabled && midiError && (
				<div className="mt-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
					{midiError}
				</div>
			)}
		</div>
	);
}
