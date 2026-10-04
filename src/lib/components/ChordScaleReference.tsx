import { useMemo, useState } from 'react';
import type { Signature } from '../types/signatures';
import type { MatchingChords } from '../utils/chords';
import { generateScaleChords, isInKey } from '../utils/chords';

interface Props {
	signature: Signature;
	notes?: any[];
	detectedChords?: string[];
	matchingChords?: MatchingChords;
	hasInfoButton?: boolean;
}

const romanMajor = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
const romanMinor = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

export default function ChordScaleReference({
	signature,
	notes = [],
	detectedChords = [],
	matchingChords = { majorMatches: [], minorMatches: [] },
	hasInfoButton = true
}: Props) {
	const [isInfoOpen, setIsInfoOpen] = useState(false);
	const scaleChords = useMemo(() => generateScaleChords(signature), [signature]);
	return (
		<div className="flex w-full flex-1 flex-col rounded-lg border bg-white p-2 shadow-sm">
			<div className="mb-2 flex items-center justify-between border-b pb-1">
				<h3 className="text-xs font-medium text-gray-700">Key: {signature.label}</h3>
				{hasInfoButton && (
					<div className="relative">
						<button
							type="button"
							className="ml-2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
							onClick={() => setIsInfoOpen((open) => !open)}
							title="Show chord notation info"
						>
							<i className="fas fa-circle-info" />
						</button>
						{isInfoOpen && (
							<div className="absolute top-full right-0 z-40 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
								<div className="space-y-1 text-xs text-gray-500">
									<p>
										<span className="font-medium">Major Scale:</span> Primary chords are I, IV and
										V.
									</p>
									<p>Uppercase numerals are major, lowercase are minor, and ° is diminished.</p>
									<p>
										<span className="font-medium">Minor Scale:</span> Primary chords are i, iv and
										v.
									</p>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			{!!notes.length && !!detectedChords.length && (
				<div className="mb-2">
					<h4 className="mb-1 text-xs font-medium text-gray-700">Detected Chords</h4>
					<div className="flex flex-wrap gap-1">
						{detectedChords.map((chord) => {
							const inKey = isInKey(chord, scaleChords);
							return (
								<span
									key={chord}
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${
										inKey ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
									}`}
								>
									{chord}
									{inKey && <span className="ml-1 text-[10px] text-green-600">(in key)</span>}
								</span>
							);
						})}
					</div>
				</div>
			)}
			<div className="overflow-hidden rounded border">
				<table className="w-full text-xs">
					<thead className="bg-gray-50 text-[10px] font-medium text-gray-700">
						<tr>
							<th className="py-0.5 pl-1 text-left">Scale</th>
							{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map((degree) => (
								<th className="py-0.5 text-center" key={degree}>
									{degree}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{(['major', 'minor'] as const).map((scale) => (
							<tr className="border-t" key={scale}>
								<td className="bg-blue-50 px-1 py-0.5 text-[10px] font-medium">
									{scale === 'major' ? 'Major' : 'Minor'}
								</td>
								{scaleChords[scale].map((chord, index) => {
									const matched = matchingChords[`${scale}Matches`].includes(index);
									return (
										<td
											key={`${scale}-${chord}-${index}`}
											className={`py-0.5 text-center text-[10px] ${
												matched
													? 'bg-green-200 font-bold'
													: [0, 3, 4].includes(index)
														? 'bg-blue-100'
														: ''
											}`}
										>
											<div>{chord}</div>
											<div className="mt-0.5 text-[8px] text-gray-500">
												{scale === 'major' ? romanMajor[index] : romanMinor[index]}
											</div>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
