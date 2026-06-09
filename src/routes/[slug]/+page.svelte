<script lang="ts">
import { base } from '$app/paths';
import { goto } from '$app/navigation';
import { AppShell } from '@skeletonlabs/skeleton';
import {
  IconExternalLink,
  IconDownload,
  IconBoxAlignRightFilled,
  Header,
  SearchBar,
  Sidebar,
  FontHeader,
  Controls,
  MonacoEditor
} from '$lib';
import { getFontDisplayName, getFontStyle } from '$lib/fontFeatures';
import {
  selectedTheme,
  fontSize,
  fontFamilyRight,
  fontLigatures,
  fontOpenTypeFeatures,
  editorLanguage,
  menuOpen,
  searchTerm
} from '$lib/store';
import type { CodingFont } from '$lib';

export let data: { fonts: CodingFont[]; font: CodingFont; compareFont?: CodingFont };
let fonts = data.fonts;
let sidebarComponent: HTMLDivElement;
let initializedComparisonFamily = '';

$: currentFont = data.font;
$: if (
  data.compareFont &&
  initializedComparisonFamily !== data.compareFont.family
) {
  $fontFamilyRight = data.compareFont.family;
  initializedComparisonFamily = data.compareFont.family;
}

$: if (currentFont && sidebarComponent) {
  $menuOpen = true;
  sidebarComponent.scrollToTop();
}

$: if ($searchTerm) {
  fonts = data.fonts.filter((font) =>
    [font.family, getFontDisplayName(font)].some((fontName) =>
      fontName.toLowerCase().includes($searchTerm.toLowerCase())
    )
  );
} else {
  fonts = data.fonts;
}

function getFontByFamilyName(familyName: string) {
  return data.fonts.find((font) => font.family === familyName);
}

function getFontPath(familyName: string) {
  return `${base}/${encodeURIComponent(familyName.replace(/\s+/g, ''))}`;
}

function getComparisonPath(familyName: string) {
  return `${getFontPath(currentFont.family)}/${encodeURIComponent(
    familyName.replace(/\s+/g, '')
  )}`;
}

function clearComparison() {
  $fontFamilyRight = '';
  goto(getFontPath(currentFont.family));
}
</script>

<AppShell
  slotSidebarLeft="flex relative min-w-0 {$menuOpen
    ? 'w-[calc(100vw-4rem)] resize-x overflow-auto sm:w-[24rem] lg:w-[30rem] lg:min-w-[12rem] lg:max-w-[100vw]'
    : 'w-0'}"
  slotHeader="z-30">
  <svelte:fragment slot="header">
    <Header />
  </svelte:fragment>
  <svelte:fragment slot="sidebarLeft">
    <Sidebar bind:this="{sidebarComponent}">
      <div class="flex flex-col gap-4">
        <ol class="breadcrumb">
          <li class="crumb">
            <a class="anchor" href="{base}/browse">Browse</a>
          </li>
          <li class="crumb-separator" aria-hidden>&rsaquo;</li>
          <li>{getFontDisplayName(currentFont)}</li>
        </ol>
        <h2 class="h2">{getFontDisplayName(currentFont)}</h2>
        <p>{`${currentFont?.variants.length} styles`}</p>
        {#if !currentFont.isSystemFont}
          <div class="flex flex-wrap gap-2">
            {#each currentFont.variants as variant (variant)}
              <a href="{currentFont.files[variant]}" target="_blank" class="code"
                >{variant}</a>
            {/each}
          </div>
        {/if}
        <div
          style="{getFontStyle(
            currentFont,
            $fontOpenTypeFeatures,
            $fontLigatures
          )}"
          class="card border-surface-400-500-token relative flex min-h-[10rem] flex-col items-center justify-center overflow-hidden whitespace-nowrap bg-white border-token dark:bg-surface-900">
          <div class="code absolute bottom-0 right-0">regular</div>
          <span>{`0oO | Ll1Iti ,.:; () [] {} <> * ??. !!`}</span>
          <span>{`"" '' != == === if 0123456789 %@ && ||`}</span>
          <span>{`// /* */ << >> <= >= => -> . ++ -- ^+-`}</span>
          <span>{`Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm`}</span>
          <span>{`Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz`}</span>
        </div>
        {#if currentFont?.variants.includes('italic')}
          <div
            style="{getFontStyle(
              currentFont,
              $fontOpenTypeFeatures,
              $fontLigatures
            )}; font-style: italic;"
            class="card border-surface-400-500-token relative flex min-h-[10rem] flex-col items-center justify-center overflow-hidden whitespace-nowrap bg-white border-token dark:bg-surface-900">
            <div class="code absolute bottom-0 right-0">italic</div>
            <span>{`0oO | Ll1Iti ,.:; () [] {} <> * ??. !!`}</span>
            <span>{`"" '' != == === if 0123456789 %@ && ||`}</span>
            <span>{`// /* */ << >> <= >= => -> . ++ -- ^+-`}</span>
            <span>{`Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm`}</span>
            <span>{`Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz`}</span>
          </div>
        {/if}
        {#if !currentFont.isSystemFont}
          <div class="table-container !overflow-x-hidden !rounded-none">
          <table
            class="table table-compact !whitespace-nowrap !rounded-none text-left">
            <tbody>
              <tr>
                <th>Dowload URL</th>
                <td>
                  <a href="{currentFont?.downloadUrl}" class="btn">
                    <IconDownload size="16" />
                    <span class="max-w-[16rem] truncate"
                      >{currentFont?.downloadUrl}</span>
                  </a>
                </td>
              </tr>
              <tr>
                <th>Webiste URL</th>
                <td>
                  <a href="{currentFont?.siteUrl}" target="_blank" class="btn">
                    <IconExternalLink size="16" />
                    <span class="max-w-[16rem] truncate"
                      >{currentFont?.siteUrl}</span>
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        {/if}
      </div>
      <hr />
      <SearchBar />
      <table
        class="table table-interactive table-hover table-compact !rounded-none">
        <tbody>
          {#each fonts as font (font)}
            <tr
              on:click="{() => {
                goto(getFontPath(font.family));
              }}"
              class:!variant-ghost-primary="{currentFont.family ===
                font.family}">
              <td
                style="{getFontStyle(
                  font,
                  $fontOpenTypeFeatures,
                  $fontLigatures
                )}"
                class="max-w-[9rem] truncate !whitespace-nowrap"
                >{getFontDisplayName(font)}</td>
              <td>
                <button
                  class="variant-ringed-surface btn btn-sm"
                  class:!variant-ghost-primary="{font.family ===
                    $fontFamilyRight}"
                  on:click|stopPropagation="{() => {
                    $fontFamilyRight = font.family;
                    goto(getComparisonPath(font.family));
                  }}">
                  <IconBoxAlignRightFilled size="16" />
                  <span>Compare</span>
                </button>
              </td>
              <td>
                <div
                  class="variant-ringed-surface btn-group [&>*+*]:border-surface-400-500-token">
                  {#if !font.isSystemFont}
                    <a href="{font?.siteUrl}" target="_blank" class="!p-2 !pl-3">
                      <IconExternalLink size="16" />
                    </a>
                    <a href="{font?.downloadUrl}" class="!p-2 !pr-3">
                      <IconDownload size="16" />
                    </a>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </Sidebar>
  </svelte:fragment>
  <svelte:fragment slot="pageHeader">
    <Controls showNameEnabled="{false}" />
  </svelte:fragment>
  <div
    class="bg-surface-50-900-token grid h-full grid-cols-1 gap-4 p-4 {$fontFamilyRight
      ? 'grid-rows-2 md:grid-cols-2 md:grid-rows-1'
      : 'md:grid-cols-2'}">
    <div
      class="flex flex-col gap-4 {!$fontFamilyRight ? 'md:col-span-2' : ''}">
      <FontHeader
        font="{currentFont}"
        showNames="{true}"
        showMaximize="{Boolean($fontFamilyRight)}"
        onMaximize="{clearComparison}" />
      <MonacoEditor
        class="overflow-hidden rounded-container-token"
        fontSize="{$fontSize}"
        fontFamily="{currentFont?.family}"
        fontLigatures="{$fontLigatures}"
        fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
        language="{$editorLanguage}"
        themeName="{$selectedTheme}" />
    </div>
    {#if $fontFamilyRight}
      <div class="relative flex flex-col gap-4">
        <FontHeader
          font="{getFontByFamilyName($fontFamilyRight)}"
          showNames="{true}"
          showMaximize="{true}"
          onMaximize="{clearComparison}" />
        <MonacoEditor
          class="overflow-hidden rounded-container-token"
          fontSize="{$fontSize}"
          fontFamily="{$fontFamilyRight}"
          fontLigatures="{$fontLigatures}"
          fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
          language="{$editorLanguage}"
          themeName="{$selectedTheme}" />
      </div>
    {/if}
  </div>
</AppShell>
