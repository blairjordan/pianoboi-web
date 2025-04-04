<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	export let isOpen = false;
	export let width = '350px';

	// Created dispatch to communicate with parent component
	const dispatch = createEventDispatcher();

	// Handle click outside to close drawer
	function handleOutsideClick(event: MouseEvent) {
		if (isOpen && event.target === event.currentTarget) {
			dispatch('close');
		}
	}

	// Handle escape key to close drawer
	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			dispatch('close');
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => {
			window.removeEventListener('keydown', handleKeydown);
		};
	});
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-30"
		on:click={handleOutsideClick}
	>
		<div
			class="h-full overflow-y-auto bg-white shadow-lg"
			style="width: {width};"
			transition:fly={{ x: width, duration: 300, easing: cubicOut }}
		>
			<div class="flex h-full flex-col">
				<div class="flex items-center justify-between border-b p-4">
					<h2 class="text-lg font-medium text-gray-800">
						<slot name="header">Drawer</slot>
					</h2>
					<button
						class="text-gray-500 hover:text-gray-700"
						on:click={() => dispatch('close')}
						aria-label="Close drawer"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<div class="flex-1 overflow-y-auto p-4">
					<slot />
				</div>
				<div class="border-t p-4">
					<slot name="footer" />
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom scrollbar for the drawer content */
	div::-webkit-scrollbar {
		width: 8px;
	}

	div::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 10px;
	}

	div::-webkit-scrollbar-thumb {
		background: #d1d5db;
		border-radius: 10px;
	}

	div::-webkit-scrollbar-thumb:hover {
		background: #9ca3af;
	}
</style>
