<script lang="ts">
	import {
		chordSets,
		createChordSet,
		deleteChordSet,
		editingSetId,
		openSetInTab,
		saveCurrentProgressionAsSet,
		toggleEditSet,
		updateChordSetName
	} from '$lib/stores/chords';
	import ChordSet from './ChordSet.svelte';

	export let onPlayChord: (chordId: string, notes: any[]) => void;

	function handlePlayChord(event: CustomEvent) {
		const { chordId, notes } = event.detail;
		onPlayChord(chordId, notes);
	}

	function handleDeleteChord(event: CustomEvent) {
		const { setId, chordId } = event.detail;
		// This would dispatch to the chords store
		// We'll implement this in the full refactor
	}

	function handleDeleteSet(event: CustomEvent) {
		const { id } = event.detail;
		deleteChordSet(id);
	}

	function handleNameChange(event: CustomEvent) {
		const { id, name } = event.detail;
		updateChordSetName(id, name);
	}

	function handleToggleEdit(event: CustomEvent) {
		const { id } = event.detail;
		toggleEditSet(id);
	}

	function handleCreateNewSet() {
		createChordSet();
	}

	function handleSaveCurrentProgression() {
		saveCurrentProgressionAsSet();
	}
</script>

<div class="chord-sets-manager">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-base font-medium text-gray-900">Saved Chord Sets</h3>
		<div class="flex space-x-2">
			<button
				class="flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
				on:click={handleSaveCurrentProgression}
				title="Save current chord progression as a new set (Ctrl+S)"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-1 h-3 w-3"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"
					/>
				</svg>
				Save Current
			</button>
			<button
				class="flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100"
				on:click={handleCreateNewSet}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="mr-1 h-3 w-3"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
						clip-rule="evenodd"
					/>
				</svg>
				New Set
			</button>
		</div>
	</div>

	{#if $chordSets.length === 0}
		<div
			class="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center text-sm text-gray-500"
		>
			<p>No saved chord sets yet</p>
			<p class="mt-2">Create a new set or save the current progression</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each $chordSets as set (set.id)}
				<div class="set-container">
					<ChordSet
						id={set.id}
						name={set.name}
						chords={set.chords}
						isEditing={$editingSetId === set.id}
						on:playChord={handlePlayChord}
						on:deleteChord={handleDeleteChord}
						on:deleteSet={handleDeleteSet}
						on:nameChange={handleNameChange}
						on:toggleEdit={handleToggleEdit}
					/>

					<div class="mt-2 flex justify-end">
						<button
							class="flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
							on:click={() => openSetInTab(set.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-1 h-3 w-3"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
								/>
							</svg>
							Open in Tab
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
