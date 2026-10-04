import { useState } from 'react';
import type { Signature } from '../types/signatures';
import { signatures } from '../types/signatures';

interface Props {
	currentSignature: Signature;
	onSelect: (signature: Signature) => void;
}

export default function KeySignatureSelector({ currentSignature, onSelect }: Props) {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<div className="relative">
			<button
				type="button"
				className="flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs font-medium shadow-sm hover:bg-gray-50"
				onClick={() => setIsOpen((open) => !open)}
			>
				<i className="fas fa-music text-blue-600" />
				<span className="font-medium text-gray-700">Key:</span>
				<span className="ml-1 text-blue-600">{currentSignature.id}</span>
				<i className="fas fa-chevron-down ml-1 text-[10px]" />
			</button>
			{isOpen && (
				<div className="absolute top-full left-0 z-30 mt-1 w-72 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
					<div className="mb-1 border-b pb-1 text-xs font-medium text-gray-700">Key Signatures</div>
					<div className="grid grid-cols-2 gap-1">
						{signatures.map((signature) => (
							<button
								key={signature.id}
								type="button"
								className={`flex flex-col items-start rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-blue-50 ${
									currentSignature.id === signature.id ? 'bg-blue-100' : ''
								}`}
								onClick={() => {
									onSelect(signature);
									setIsOpen(false);
								}}
							>
								<span className="font-medium">{signature.id}</span>
								<span className="text-[10px] text-gray-500">{signature.label}</span>
								<span
									className={`mt-0.5 inline-flex items-center rounded-md px-1 py-0.5 text-[10px] font-medium ${
										signature.sharps
											? 'bg-amber-50 text-amber-700'
											: signature.flats
												? 'bg-sky-50 text-sky-700'
												: 'bg-gray-50 text-gray-600'
									}`}
								>
									{signature.sharps
										? `${signature.sharps} sharp${signature.sharps === 1 ? '' : 's'}`
										: signature.flats
											? `${signature.flats} flat${signature.flats === 1 ? '' : 's'}`
											: 'No sharps/flats'}
								</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
