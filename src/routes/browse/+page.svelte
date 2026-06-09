<script lang="ts">
import { AppShell } from '@skeletonlabs/skeleton';
import {
  Header,
  SearchBar,
  FontTable,
  Sidebar,
  FontHeader,
  Controls,
  MonacoEditor
} from '$lib';
import { getFontDisplayName } from '$lib/fontFeatures';
import {
  selectedTheme,
  fontSize,
  fontFamily,
  fontFamilyRight,
  fontLigatures,
  fontOpenTypeFeatures,
  editorLanguage,
  searchTerm
} from '$lib/store';
import type { CodingFont } from '$lib';

export let data: { fonts: CodingFont[] };
let { fonts } = data;

function getFontByFamilyName(familyName: string) {
  return data.fonts.find((font) => font.family === familyName);
}

function clearComparison() {
  $fontFamilyRight = '';
}

$: currentFont = getFontByFamilyName($fontFamily) ?? data.fonts[0];
$: comparisonFont = getFontByFamilyName($fontFamilyRight);

$: if ($searchTerm) {
  fonts = data.fonts.filter((font) =>
    [font.family, getFontDisplayName(font)].some((fontName) =>
      fontName.toLowerCase().includes($searchTerm.toLowerCase())
    )
  );
} else {
  fonts = data.fonts;
}
</script>

<AppShell
  slotSidebarLeft="flex relative min-w-0 w-[calc(100vw-4rem)] resize-x overflow-auto sm:w-[24rem] lg:w-[30rem] lg:min-w-[12rem] lg:max-w-[100vw]"
  slotHeader="z-30">
  <svelte:fragment slot="header">
    <Header />
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <Sidebar alwaysOpen="{true}">
      <SearchBar />
      <FontTable fonts="{fonts}" showNames="{true}" />
    </Sidebar>
  </svelte:fragment>
  <svelte:fragment slot="pageHeader">
    <Controls showNameEnabled="{false}" />
  </svelte:fragment>
  <div
    class="bg-surface-50-900-token grid h-full grid-cols-1 gap-4 p-4 {comparisonFont
      ? 'grid-rows-2 md:grid-cols-2 md:grid-rows-1'
      : 'md:grid-cols-2'}">
    {#if currentFont}
      <div
        class="flex flex-col gap-4 {!comparisonFont ? 'md:col-span-2' : ''}">
        <FontHeader
          font="{currentFont}"
          showNames="{true}"
          showMaximize="{Boolean(comparisonFont)}"
          onMaximize="{clearComparison}" />
        <MonacoEditor
          class="overflow-hidden rounded-container-token"
          fontSize="{$fontSize}"
          fontFamily="{currentFont.family}"
          fontLigatures="{$fontLigatures}"
          fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
          language="{$editorLanguage}"
          themeName="{$selectedTheme}" />
      </div>
    {/if}
    {#if comparisonFont}
      <div class="relative flex flex-col gap-4">
        <FontHeader
          font="{comparisonFont}"
          showNames="{true}"
          showMaximize="{true}"
          onMaximize="{clearComparison}" />
        <MonacoEditor
          class="overflow-hidden rounded-container-token"
          fontSize="{$fontSize}"
          fontFamily="{comparisonFont.family}"
          fontLigatures="{$fontLigatures}"
          fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
          language="{$editorLanguage}"
          themeName="{$selectedTheme}" />
      </div>
    {/if}
  </div>
</AppShell>
