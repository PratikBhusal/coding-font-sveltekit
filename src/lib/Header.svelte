<script lang="ts">
import { base } from '$app/paths';
import { page } from '$app/stores';
import { TabGroup, TabAnchor } from '@skeletonlabs/skeleton';
import { Logo, ThemeSwitch } from '$lib';

$: gamePath = `${base}/`;
$: browsePath = `${base}/browse`;

</script>

<div
  class="bg-surface-100-800-token flex flex-row items-center justify-between gap-4 border-b border-surface-400 p-4 dark:border-surface-700">
  <div class="flex items-center justify-center gap-4">
    <a href="{gamePath}"><Logo class="h-[3rem] w-auto" /></a>
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
    <TabAnchor href="https://typogram.co/studio/" class="ml-4"
      >Studio</TabAnchor>
  </TabGroup>

  <ThemeSwitch />
</div>
