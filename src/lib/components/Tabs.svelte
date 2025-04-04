<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let tabs: { id: string; label: string; isActive: boolean }[] = [];
	export let activeTabId: string | null = null;

	const dispatch = createEventDispatcher();

	function setActiveTab(id: string) {
		dispatch('tabChange', { id });
	}

	function closeTab(event: MouseEvent, id: string) {
		event.stopPropagation();
		dispatch('tabClose', { id });
	}
</script>

{#if tabs.length > 0}
	<div class="mb-4 border-b">
		<div class="scrollbar-thin flex overflow-x-auto">
			{#each tabs as tab}
				<div
					class="flex cursor-pointer items-center whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors"
					class:border-blue-500={tab.id === activeTabId}
					class:border-transparent={tab.id !== activeTabId}
					class:text-blue-600={tab.id === activeTabId}
					class:text-gray-500={tab.id !== activeTabId}
					class:hover:text-blue-800={tab.id !== activeTabId}
					class:hover:border-gray-300={tab.id !== activeTabId}
					on:click={() => setActiveTab(tab.id)}
					role="tab"
					tabindex="0"
				>
					<span>{tab.label}</span>
					<div
						class="ml-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
						on:click={(e) => closeTab(e, tab.id)}
						aria-label="Close tab"
						role="button"
						tabindex="0"
					>
						<svg class="h-3 w-3" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
							<path
								d="M6 5.293l4.146-4.147a.5.5 0 0 1 .708.708L6.707 6l4.147 4.146a.5.5 0 0 1-.708.708L6 6.707l-4.146 4.147a.5.5 0 0 1-.708-.708L5.293 6 1.146 1.854a.5.5 0 1 1 .708-.708L6 5.293z"
								fill="currentColor"
							/>
						</svg>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.scrollbar-thin::-webkit-scrollbar {
		height: 4px;
	}

	.scrollbar-thin::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 10px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 10px;
	}

	.scrollbar-thin::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
