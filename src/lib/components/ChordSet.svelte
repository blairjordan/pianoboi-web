<script lang="ts">
	import type { Signature } from '$lib/types/signatures';
	import { createEventDispatcher } from 'svelte';
	import Piano from './Piano.svelte';

	export let id: string;
	export let name: string;
	export let chords: {
		id: string;
		notes: any[];
		signature: Signature;
		timestamp: number;
	}[] = [];
	export let isEditing = false;

	const dispatch = createEventDispatcher();

	function handleNameChange(event: Event) {
		const input = event.target as HTMLInputElement;
		dispatch('nameChange', { id, name: input.value });
	}

	function handlePlayChord(chordId: string, notes: any[]) {
		dispatch('playChord', { chordId, notes });
	}

	function handleDeleteChord(chordId: string) {
		dispatch('deleteChord', { setId: id, chordId });
	}

	function handleDeleteSet() {
		dispatch('deleteSet', { id });
	}
</script>

<div class="chord-set rounded-lg border bg-white shadow-sm">
	<div class="flex items-center justify-between border-b p-3">
		{#if isEditing}
			<input
				type="text"
				class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
				value={name}
				on:blur={handleNameChange}
				on:keydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
				autofocus
			/>
		{:else}
			<h3 class="text-md font-medium text-gray-800">{name}</h3>
		{/if}

		<div class="flex items-center gap-1">
			<button
				class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
				on:click={() => dispatch('toggleEdit', { id })}
				title={isEditing ? 'Save name' : 'Edit name'}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					{#if isEditing}
						<path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
					{:else}
						<path
							d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
						/>
					{/if}
				</svg>
			</button>
			<button
				class="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-500"
				on:click={handleDeleteSet}
				title="Delete set"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
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
		</div>
	</div>

	<div class="p-3">
		{#if chords.length === 0}
			<p class="py-4 text-center text-sm text-gray-500">No chords in this set yet.</p>
		{:else}
			<div class="space-y-3">
				{#each chords as chord}
					<div
						class="chord-item flex items-center justify-between rounded-lg border bg-gray-50 p-2"
					>
						<div class="flex-1 overflow-hidden">
							<!-- Compact Piano Display with max-width to prevent overflow -->
							<div class="piano-display-wrapper max-w-full overflow-hidden">
								<Piano
									notes={chord.notes}
									readonly={true}
									compact={true}
									showLabels={true}
									signature={chord.signature}
								/>
							</div>
						</div>

						<div class="ml-2 flex flex-col gap-1">
							<button
								class="rounded bg-blue-500 p-1 text-white hover:bg-blue-600"
								on:click={() => handlePlayChord(chord.id, chord.notes)}
								title="Play chord"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>

							<button
								class="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-red-500"
								on:click={() => handleDeleteChord(chord.id)}
								title="Delete chord"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.piano-display-wrapper {
		border-radius: 0.375rem;
	}
</style>
