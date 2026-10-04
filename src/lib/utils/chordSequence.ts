export const CHORD_SEQUENCE_INTERVAL_MS = 1600;

/** Play each item in order and allow the final item a full interval to sound. */
export function startChordSequence<T>(
	items: readonly T[],
	onPlay: (item: T, index: number) => void,
	onComplete: () => void,
	intervalMs = CHORD_SEQUENCE_INTERVAL_MS
): () => void {
	let timer: number | null = null;
	let cancelled = false;

	const playNext = (index: number) => {
		if (cancelled) return;
		if (index >= items.length) {
			timer = null;
			onComplete();
			return;
		}
		onPlay(items[index], index);
		timer = window.setTimeout(() => playNext(index + 1), intervalMs);
	};

	playNext(0);
	return () => {
		cancelled = true;
		if (timer !== null) window.clearTimeout(timer);
	};
}
