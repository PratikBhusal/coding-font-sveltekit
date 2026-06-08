<script lang="ts">
import { base } from '$app/paths';
import { IconDownload, IconExternalLink, IconMaximize } from '$lib';
import { showName } from '$lib/store';
import type { CodingFont } from './codingFonts';

export let font: CodingFont;
export let showNames: boolean | undefined = undefined;

$: fontPath = `${base}/${encodeURIComponent(font.family.replace(/\s+/g, ''))}`;
$: shouldShowName = showNames ?? $showName;
</script>

{#if shouldShowName}
  <div class="flex flex-row items-center justify-between">
    <a
      href="{fontPath}"
      class="h3 truncate whitespace-nowrap hover:underline">{font.family}</a>
    <div
      class="variant-ringed-surface btn-group [&>*+*]:border-surface-400-500-token">
      <a href="{font.siteUrl}" target="_blank">
        <IconExternalLink size="24" />
        <span class="hidden 2xl:block">Visit {font.family}</span>
      </a>
      <a href="{font.downloadUrl}">
        <IconDownload size="24" />
        <span class="hidden 2xl:block">Download {font.family}</span>
      </a>
      <a href="{fontPath}">
        <IconMaximize size="24" />
      </a>
    </div>
  </div>
{/if}
