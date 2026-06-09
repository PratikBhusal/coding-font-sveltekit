<script lang="ts">
import { base } from '$app/paths';
import { page } from '$app/stores';
import { TabGroup, TabAnchor } from '@skeletonlabs/skeleton';
import { IconMenu, ThemeSwitch } from '$lib';
import { menuOpen } from '$lib/store';

$: gamePath = `${base}/`;
$: browsePath = `${base}/browse`;

</script>

<div
  class="bg-surface-100-800-token flex flex-row items-center justify-between gap-4 border-b border-surface-400 p-4 dark:border-surface-700">
  <div class="flex items-center justify-center gap-4">
    <button
      class="variant-soft btn-icon"
      aria-label="{$menuOpen ? 'Hide sidebar' : 'Show sidebar'}"
      title="{$menuOpen ? 'Hide sidebar' : 'Show sidebar'}"
      on:click="{() => {
        $menuOpen = !$menuOpen;
      }}">
      <IconMenu class="h-6 w-6" />
    </button>
  </div>

  <TabGroup
    flex="hidden md:flex"
    padding="px-2"
    border="border-none h3 relative"
    hover=""
    active="before:content-['<'] after:content-['>']">
    <TabAnchor href="{gamePath}" selected="{$page.url.pathname === gamePath}"
      >Game</TabAnchor>
    <TabAnchor
      href="{browsePath}"
      selected="{$page.url.pathname === browsePath}"
      >Browse</TabAnchor>
  </TabGroup>

  <ThemeSwitch />
</div>
