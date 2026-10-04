import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
	readScratchpad,
	SCRATCHPAD_CHANGE_EVENT,
	SCRATCHPAD_STORAGE_KEY,
	writeScratchpad
} from '../utils/scratchpad';

interface Props {
	onClose: () => void;
}

const customComponentPattern =
	/(<Chord(?:\s+name=(?:"([^"]*)"|'([^']*)'))?\s*>([\s\S]*?)<\/Chord>|<Key(?:\s+note=(?:"([^"]*)"|'([^']*)'))?\s*\/>|<Key\s*>([\s\S]*?)<\/Key>|<Keys\s*>([\s\S]*?)<\/Keys>|\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/gi;

function safeHref(value: string): string | null {
	const href = value.trim();
	if (/^(https?:|mailto:)/i.test(href)) return href;
	return null;
}

function KeyPill({ note }: { note: string }) {
	return (
		<span
			className="mx-0.5 inline-flex min-w-7 items-center justify-center rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 font-mono text-xs font-semibold text-blue-800 shadow-sm"
			title={`Piano key ${note}`}
		>
			{note}
		</span>
	);
}

function Keys({ value }: { value: string }) {
	const notes = value
		.trim()
		.split(/[\s,]+/)
		.filter(Boolean);
	return (
		<span className="inline-flex flex-wrap items-center gap-0.5">
			{notes.map((note, index) => (
				<KeyPill key={`${note}-${index}`} note={note} />
			))}
		</span>
	);
}

function ChordPill({ name, children }: { name: string; children: string }) {
	const keysMatch = children.match(/<Keys\s*>([\s\S]*?)<\/Keys>/i);
	const notes = keysMatch?.[1] || children.replace(/<[^>]+>/g, '').trim();
	return (
		<span className="mx-0.5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1 align-middle text-violet-900">
			<span className="text-xs font-bold">{name || 'Chord'}</span>
			{notes ? <Keys value={notes} /> : null}
		</span>
	);
}

function renderScratchpadInline(value: string, keyPrefix = 'inline'): ReactNode[] {
	const nodes: ReactNode[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	customComponentPattern.lastIndex = 0;

	while ((match = customComponentPattern.exec(value))) {
		if (match.index > lastIndex) nodes.push(value.slice(lastIndex, match.index));
		const key = `${keyPrefix}-${match.index}`;
		if (match[1].startsWith('<Chord')) {
			nodes.push(<ChordPill key={key} name={match[2] || match[3] || ''} children={match[4]} />);
		} else if (match[1].startsWith('<Keys')) {
			nodes.push(<Keys key={key} value={match[8]} />);
		} else if (match[5] !== undefined || match[6] !== undefined) {
			nodes.push(<KeyPill key={key} note={match[5] || match[6] || '?'} />);
		} else if (match[1].startsWith('<Key>')) {
			nodes.push(<KeyPill key={key} note={match[7].trim()} />);
		} else if (match[9] !== undefined) {
			nodes.push(<strong key={key}>{match[9]}</strong>);
		} else if (match[10] !== undefined) {
			nodes.push(
				<code key={key} className="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">
					{match[10]}
				</code>
			);
		} else {
			const href = safeHref(match[12]);
			nodes.push(
				href ? (
					<a
						key={key}
						href={href}
						target="_blank"
						rel="noreferrer"
						className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2"
					>
						{match[11]}
					</a>
				) : (
					<span key={key}>{match[11]}</span>
				)
			);
		}
		lastIndex = customComponentPattern.lastIndex;
	}
	if (lastIndex < value.length) nodes.push(value.slice(lastIndex));
	return nodes;
}

export function ScratchpadMarkdown({ content }: { content: string }) {
	const blocks = useMemo(() => {
		const lines = content.replace(/\r\n/g, '\n').split('\n');
		const output: ReactNode[] = [];
		let index = 0;
		while (index < lines.length) {
			const line = lines[index];
			if (!line.trim()) {
				index += 1;
				continue;
			}

			const heading = line.match(/^(#{1,3})\s+(.+)$/);
			if (heading) {
				const level = heading[1].length;
				const className =
					level === 1
						? 'text-xl font-bold text-gray-900'
						: level === 2
							? 'text-base font-bold text-gray-900'
							: 'text-sm font-bold text-gray-800';
				output.push(
					<div key={`heading-${index}`} role="heading" aria-level={level} className={className}>
						{renderScratchpadInline(heading[2], `heading-${index}`)}
					</div>
				);
				index += 1;
				continue;
			}

			if (/^[-*]\s+/.test(line)) {
				const items: string[] = [];
				while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
					items.push(lines[index].replace(/^[-*]\s+/, ''));
					index += 1;
				}
				output.push(
					<ul key={`list-${index}`} className="list-disc space-y-1 pl-5">
						{items.map((item, itemIndex) => (
							<li key={itemIndex}>{renderScratchpadInline(item, `list-${index}-${itemIndex}`)}</li>
						))}
					</ul>
				);
				continue;
			}

			if (line.startsWith('> ')) {
				output.push(
					<blockquote
						key={`quote-${index}`}
						className="border-l-2 border-blue-300 pl-3 text-gray-600 italic"
					>
						{renderScratchpadInline(line.slice(2), `quote-${index}`)}
					</blockquote>
				);
				index += 1;
				continue;
			}

			output.push(
				<p key={`paragraph-${index}`} className="leading-6">
					{renderScratchpadInline(line, `paragraph-${index}`)}
				</p>
			);
			index += 1;
		}
		return output;
	}, [content]);

	return <div className="space-y-3 text-sm text-gray-700">{blocks}</div>;
}

export default function Scratchpad({ onClose }: Props) {
	const [content, setContent] = useState(readScratchpad);
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		const sync = () => setContent(readScratchpad());
		const handleStorage = (event: StorageEvent) => {
			if (event.key === SCRATCHPAD_STORAGE_KEY) sync();
		};
		window.addEventListener('storage', handleStorage);
		window.addEventListener(SCRATCHPAD_CHANGE_EVENT, sync);
		const interval = window.setInterval(sync, 500);
		return () => {
			window.removeEventListener('storage', handleStorage);
			window.removeEventListener(SCRATCHPAD_CHANGE_EVENT, sync);
			window.clearInterval(interval);
		};
	}, []);

	return (
		<aside
			className="absolute inset-y-0 right-0 z-20 flex w-[min(24rem,calc(100vw-1.5rem))] flex-col border-l border-gray-200 bg-white shadow-2xl lg:relative lg:z-auto lg:w-96 lg:shrink-0 lg:shadow-lg"
			aria-label="Learning scratchpad"
		>
			<div className="flex items-start justify-between gap-3 border-b bg-slate-50 px-4 py-3">
				<div>
					<h2 className="font-bold text-gray-900">Scratchpad</h2>
					<p className="text-xs text-gray-500">Live notes from your piano helper</p>
				</div>
				<div className="flex items-center gap-1">
					<button
						type="button"
						className="rounded-md px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
						onClick={() => setIsEditing((value) => !value)}
					>
						{isEditing ? 'Preview' : 'Edit'}
					</button>
					<button
						type="button"
						className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-800"
						onClick={onClose}
						aria-label="Close scratchpad"
					>
						<i className="fas fa-times" />
					</button>
				</div>
			</div>
			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				{isEditing ? (
					<label className="flex h-full min-h-64 flex-col gap-2 text-xs font-medium text-gray-600">
						Scratchpad Markdown
						<textarea
							className="min-h-64 flex-1 resize-none rounded-lg border border-gray-300 p-3 font-mono text-sm font-normal text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							value={content}
							onChange={(event) => writeScratchpad(event.target.value)}
							placeholder={
								'# Song notes\n\nTry <Chord name="C major"><Keys>C4 E4 G4</Keys></Chord>'
							}
						/>
					</label>
				) : content.trim() ? (
					<ScratchpadMarkdown content={content} />
				) : (
					<div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
						<p className="font-semibold text-gray-800">Nothing here yet</p>
						<p className="mt-1">
							A chat agent can add song hints, chord progressions and practice notes here while you
							play.
						</p>
						<p className="mt-3 text-xs text-gray-500">
							Browser key: <code className="font-mono">{SCRATCHPAD_STORAGE_KEY}</code>
						</p>
					</div>
				)}
			</div>
		</aside>
	);
}
