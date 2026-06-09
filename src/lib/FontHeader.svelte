<script lang="ts">
import { base } from '$app/paths';
import { IconDownload, IconExternalLink, IconMaximize } from '$lib';
import { getFontDisplayName } from './fontFeatures';
import { showName } from '$lib/store';
import type { CodingFont } from './codingFonts';

export let font: CodingFont;
export let showNames: boolean | undefined = undefined;
export let showMaximize = true;
export let onMaximize: ((font: CodingFont) => void) | undefined = undefined;

$: fontPath = `${base}/${encodeURIComponent(font.family.replace(/\s+/g, ''))}`;
$: shouldShowName = showNames ?? $showName;
$: fontDisplayName = getFontDisplayName(font);
</script>

{#if shouldShowName}
  <div class="flex flex-row items-center justify-between">
    {#if font.isSystemFont}
      <span class="h3 truncate whitespace-nowrap">{fontDisplayName}</span>
    {:else}
      <a
        href="{fontPath}"
        class="h3 truncate whitespace-nowrap hover:underline">{fontDisplayName}</a>
    {/if}
    <div
      class="variant-ringed-surface btn-group [&>*+*]:border-surface-400-500-token">
      {#if !font.isSystemFont}
        <a href="{font.siteUrl}" target="_blank">
          <IconExternalLink size="24" />
          <span class="hidden 2xl:block">Visit {fontDisplayName}</span>
        </a>
        <a href="{font.downloadUrl}">
          <IconDownload size="24" />
          <span class="hidden 2xl:block">Download {fontDisplayName}</span>
        </a>
      {/if}
      {#if showMaximize}
        <a
          href="{fontPath}"
          on:click="{() => {
            onMaximize?.(font);
          }}">
          <IconMaximize size="24" />
        </a>
      {/if}
    </div>
  </div>
{/if}
