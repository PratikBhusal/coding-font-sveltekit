<script lang="ts">
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';
import type { Writable } from 'svelte/store';
import { LightSwitch, localStorageStore } from '@skeletonlabs/skeleton';
import { IconColorSwatch } from '$lib';
import {
  DEFAULT_SIDEBAR_WIDTH,
  menuOpen,
  sidebarWidth
} from '$lib/store';
import ArrowsHorizontal from 'svelte-tabler/ArrowsHorizontal.svelte';

const themeSelection: Writable<string> = localStorageStore(
  'themeSelection',
  'standard'
);
const themes = [
  { id: 'standard', displayName: 'Standard' },
  { id: 'modern', displayName: 'Modern' },
  { id: 'seafoam', displayName: 'Seafoam' },
  { id: 'wintry', displayName: 'Wintry' },
  { id: 'skeleton', displayName: 'Skeleton' },
  { id: 'crimson', displayName: 'Crimson' },
  { id: 'rocket', displayName: 'Rocket' },
  { id: 'vintage', displayName: 'Vintage' },
  { id: 'sahara', displayName: 'Sahara' },
  { id: 'hamlindigo', displayName: 'Hamlindigo' },
  { id: 'gold-nouveau', displayName: 'Gold Nouveau' }
];
let isOpen = false;

onMount(() => {
  document.body.setAttribute('data-theme', $themeSelection);
});

function handleChangeTheme(selectedTheme) {
  $themeSelection = selectedTheme;
  document.body.setAttribute('data-theme', selectedTheme);
}

function resetSidebarWidth() {
  $menuOpen = true;
  $sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
  isOpen = false;
}
</script>

<div class="relative">
  <button
    class="variant-soft btn-icon"
    on:click="{() => {
      isOpen = !isOpen;
    }}">
    <IconColorSwatch size="24" />
  </button>
  {#if isOpen}
    <div
      transition:fly="{{
        duration: 200,
        y: 20
      }}"
      class="card bg-surface-200-700-token absolute right-0 top-full z-30 mt-2 h-auto w-60 p-4 shadow-xl">
      <div class="mb-4 flex flex-col gap-2">
        <button class="btn justify-start" on:click="{resetSidebarWidth}">
          <ArrowsHorizontal size="18" />
          <span>Reset sidebar width</span>
        </button>
      </div>
      <LightSwitch />
      <div class="mt-4 flex flex-col gap-2">
        {#each themes as themeItem}
          <button
            class="btn hover:variant-soft-secondary"
            class:!variant-filled="{themeItem.id === $themeSelection}"
            on:click="{() => handleChangeTheme(themeItem.id)}">
            {themeItem.displayName}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
