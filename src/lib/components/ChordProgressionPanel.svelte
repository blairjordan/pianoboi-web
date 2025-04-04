<script lang="ts">
	import {
		currentChordId,
		deleteChord,
		playingChordId,
		savedChords,
		setCurrentChord
	} from '$lib/stores/chords';
	import { onMount } from 'svelte';
	import Piano from './Piano.svelte';

	export let onPlayChord: (id: string, notes: any[]) => void;

	let chordsContainerElement: HTMLDivElement;

	// Set the insertion point when a chord is clicked
	function handleChordClick(id: string) {
		setCurrentChord(id);
	}

	// Play a chord when the play button is clicked
	function playChord(id: string, notes: any[]) {
		onPlayChord(id, notes);
	}

	// Scroll to the currently selected insertion point
	function scrollToInsertionPoint() {
		if (!$currentChordId) return;

		// Use a small delay to ensure DOM is updated
		setTimeout(() => {
			const markerId =
				$currentChordId === 'top' ? 'insert-marker-top' : `insert-marker-${$currentChordId}`;
			const marker = document.getElementById(markerId);
			if (marker) {
				marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 50);
	}

	onMount(() => {
		// Initially scroll to the bottom of the list to add chords at the end
		if (chordsContainerElement && $savedChords.length > 0) {
			chordsContainerElement.scrollTop = chordsContainerElement.scrollHeight;
		}
	});
</script>

<div class="chords-container rounded-lg border bg-white">
	<!-- Chord progression list -->
	<div class="overflow-auto p-4" bind:this={chordsContainerElement} style="max-height: 500px;">
		{#if $savedChords.length === 0}
			<div
				class="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center"
			>
				<p class="mb-2 text-sm text-gray-500">No chords saved yet.</p>
				<p class="text-sm text-gray-500">
					Play some notes on your keyboard and press Space to save a chord.
				</p>
			</div>
		{:else}
			<div class="space-y-1">
				<!-- Top insertion marker - Now always visible -->
				<div
					id="insert-marker-top"
					class="insertion-marker relative my-3 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-100 py-2"
					class:active-marker={$currentChordId === 'top'}
				>
					<div class="h-[2px] w-full rounded bg-blue-200"></div>
					<div
						class="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm hover:bg-blue-50"
						on:click={() => setCurrentChord('top')}
					>
						<i class="fas fa-plus text-blue-500"></i>
					</div>
				</div>

				{#each $savedChords as chord (chord.id)}
					<div class="chord-item-container">
						<div
							id={chord.id}
							class="chord-item relative rounded-lg border bg-white p-4 shadow-sm transition-all duration-150 hover:shadow-md"
							class:selected-chord={$currentChordId === chord.id}
							on:click={() => handleChordClick(chord.id)}
						>
							<!-- Chord content -->
							<div class="flex items-center">
								<div class="flex-1 overflow-hidden">
									<!-- Compact piano display -->
									<Piano
										notes={chord.notes}
										readonly={true}
										compact={true}
										showLabels={true}
										signature={chord.signature}
									/>
								</div>

								<!-- Delete button -->
								<button
									class="ml-2 rounded-full bg-white p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
									on:click={(e) => {
										e.stopPropagation();
										deleteChord(chord.id);
									}}
									aria-label="Delete chord"
									title="Delete chord"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
											clip-rule="evenodd"
										/>
									</svg>
								</button>

								<!-- Play button -->
								<button
									class="ml-1 flex items-center rounded-full bg-blue-500 px-2 py-1 text-white transition-colors hover:bg-blue-600"
									class:animate-pulse={$playingChordId === chord.id}
									on:click={(e) => {
										e.stopPropagation();
										playChord(chord.id, chord.notes);
									}}
									aria-label="Play chord"
									title="Play chord"
								>
									<i class="fas fa-play mr-1 text-xs"></i>
									<span class="text-xs">Play</span>
								</button>
							</div>
						</div>

						<!-- Insertion marker after each chord - Now always visible -->
						<div
							id="insert-marker-top"
							class="insertion-marker relative my-3 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-100 py-2"
							class:active-marker={$currentChordId === chord.id}
						>
							<div class="h-[2px] w-full rounded bg-blue-200"></div>
							<div
								class="absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white shadow-sm hover:bg-blue-50"
								on:click={() => setCurrentChord(chord.id)}
							>
								<i class="fas fa-plus text-blue-500"></i>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Focus button that floats in the bottom-right corner -->
	<button
		class="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
		on:click={scrollToInsertionPoint}
		aria-label="Focus on current insertion point"
		title="Focus on insertion point"
	>
		<i class="fas fa-crosshairs text-gray-600"></i>
	</button>
</div>

<style>
	.chord-item:hover {
		background-color: #f9fafb;
	}

	.selected-chord {
		border-color: #3b82f6 !important;
		border-width: 2px !important;
		box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.5);
	}

	.active-marker {
		background-color: #ebf5ff;
		border-color: #3b82f6 !important;
	}

	.insertion-marker {
		transition: all 0.2s ease-in-out;
	}

	.insertion-marker:hover {
		background-color: #ebf5ff;
	}
</style>
