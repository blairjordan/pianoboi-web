import { useState } from 'react';
import { AGENT_INSTRUCTIONS_TEXT } from '../utils/browserAgent';

interface Props {
	onClose: () => void;
}

const examples = [
	{
		title: 'Store a chord',
		code: `const chord = window.pianoboiAgent.chords.add({
  notes: ['C4', 'E4', 'G4'],
  signatureId: 'C',
  setId: null
});`
	},
	{
		title: 'Modify or remove it',
		code: `window.pianoboiAgent.chords.update(chord.id, {
  notes: ['D4', 'F#4', 'A4'],
  signatureId: 'D'
});
window.pianoboiAgent.chords.move(chord.id, 0);
window.pianoboiAgent.chords.remove(chord.id);`
	},
	{
		title: 'Write live learning notes',
		code: `window.pianoboiAgent.scratchpad.set(
  '# Chorus\\nPlay <Chord name="C"><Keys>C4 E4 G4</Keys></Chord>'
);
window.pianoboiAgent.scratchpad.append('Then play <Key>F4</Key>.');`
	}
];

export default function AgentInstructions({ onClose }: Props) {
	const [copyStatus, setCopyStatus] = useState('Copy all instructions');
	const [agentUpdate, setAgentUpdate] = useState('');
	const [applyStatus, setApplyStatus] = useState('');

	const copyInstructions = async () => {
		try {
			await navigator.clipboard.writeText(AGENT_INSTRUCTIONS_TEXT);
			setCopyStatus('Copied');
			window.setTimeout(() => setCopyStatus('Copy all instructions'), 1600);
		} catch {
			setCopyStatus('Copy failed');
		}
	};

	const applyAgentUpdate = () => {
		try {
			const api = window.pianoboiAgent;
			if (!api) throw new Error('The page API is not ready.');
			const payload = JSON.parse(agentUpdate) as {
				chords?: Parameters<typeof api.chords.replaceAll>[0];
				scratchpad?: string;
				appendScratchpad?: string;
			};
			let changed = 0;
			if (payload.chords) {
				api.chords.replaceAll(payload.chords);
				changed += payload.chords.length;
			}
			if (typeof payload.scratchpad === 'string') {
				api.scratchpad.set(payload.scratchpad);
				changed += 1;
			}
			if (typeof payload.appendScratchpad === 'string') {
				api.scratchpad.append(payload.appendScratchpad);
				changed += 1;
			}
			if (!changed) throw new Error('Include chords, scratchpad, or appendScratchpad.');
			setApplyStatus(`Applied ${changed} update${changed === 1 ? '' : 's'}.`);
		} catch (error) {
			setApplyStatus(error instanceof Error ? error.message : 'Could not apply the update.');
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3"
			onMouseDown={(event) => {
				if (event.target === event.currentTarget) onClose();
			}}
		>
			<section
				role="dialog"
				aria-modal="true"
				aria-labelledby="agent-instructions-title"
				className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
			>
				<header className="flex items-start justify-between gap-4 border-b bg-slate-50 px-5 py-4">
					<div>
						<h2 id="agent-instructions-title" className="text-lg font-bold text-gray-900">
							Agent Instructions
						</h2>
						<p className="mt-1 text-sm text-gray-600">
							Use the page API to change browser memory and update the interface immediately.
						</p>
					</div>
					<button
						type="button"
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900"
						onClick={onClose}
						aria-label="Close agent instructions"
					>
						<i className="fas fa-times" />
					</button>
				</header>

				<div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 text-sm text-gray-700">
					<div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
						<p className="font-semibold text-blue-900">Run JavaScript in this page’s context</p>
						<p className="mt-1 text-blue-800">
							Use <code className="rounded bg-white/70 px-1">window.pianoboiAgent</code>. The API
							validates chord notes, persists changes, and refreshes this view without a reload.
						</p>
					</div>

					{examples.map((example) => (
						<section key={example.title}>
							<h3 className="mb-2 font-bold text-gray-900">{example.title}</h3>
							<pre className="overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-5 text-slate-100">
								<code>{example.code}</code>
							</pre>
						</section>
					))}

					<section>
						<h3 className="font-bold text-gray-900">Useful discovery commands</h3>
						<ul className="mt-2 list-disc space-y-1 pl-5">
							<li>
								<code>window.pianoboiAgent.chords.list()</code> reads the current ordered chords.
							</li>
							<li>
								<code>window.pianoboiAgent.sets</code> supports list, add, update, and remove.
							</li>
							<li>
								<code>window.pianoboiAgent.help()</code> returns the complete instructions as text.
							</li>
							<li>
								<code>window.pianoboiAgent.storageKeys</code> lists the backing localStorage keys.
							</li>
						</ul>
					</section>

					<section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
						<h3 className="font-bold text-emerald-950">Browser agent bridge</h3>
						<p className="mt-1 text-xs text-emerald-800">
							For browser tools that cannot call page globals, paste one JSON update here. Chords
							are replaced in order and the open app updates immediately.
						</p>
						<label className="mt-3 block text-xs font-semibold text-emerald-950">
							Agent update JSON
							<textarea
								className="mt-1 min-h-32 w-full resize-y rounded-lg border border-emerald-300 bg-white p-3 font-mono text-xs font-normal text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
								value={agentUpdate}
								onChange={(event) => setAgentUpdate(event.target.value)}
								placeholder={
									'{"chords":[{"notes":["C4","E4","G4"],"signatureId":"C"}],"scratchpad":"# Notes"}'
								}
							/>
						</label>
						<div className="mt-2 flex items-center justify-between gap-3">
							<span role="status" className="text-xs text-emerald-900">
								{applyStatus}
							</span>
							<button
								type="button"
								className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
								onClick={applyAgentUpdate}
							>
								Apply browser-memory update
							</button>
						</div>
					</section>
				</div>

				<footer className="flex items-center justify-between gap-3 border-t bg-slate-50 px-5 py-3">
					<p className="text-xs text-gray-500">
						Notes must include an octave, such as C4, Bb3, or F#5.
					</p>
					<button
						type="button"
						className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
						onClick={() => void copyInstructions()}
					>
						<i className="fas fa-copy mr-2" />
						{copyStatus}
					</button>
				</footer>
			</section>
		</div>
	);
}
