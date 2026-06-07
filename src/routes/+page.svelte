<script lang="ts">
import { base } from '$app/paths';
import { onMount, tick } from 'svelte';
import { AppShell } from '@skeletonlabs/skeleton';
import {
  IconDownload,
  IconExternalLink,
  IconMaximize,
  Header,
  Sidebar,
  FontHeader,
  Controls,
  MonacoEditor,
  PlayerBadge,
  WinnerBadge,
  createGame,
  createConfetti
} from '$lib';
import { getFontStyle } from '$lib/fontFeatures';
import {
  showName,
  selectedTheme,
  fontSize,
  fontLigatures,
  fontOpenTypeFeatures,
  editorLanguage,
  menuOpen,
  tournamentFontFamilies
} from '$lib/store';
import type { CodingFont } from '$lib';

export let data: { fonts: CodingFont[] };
let { fonts } = data;
let game;
let currentBracket;
let leftButton, rightButton;
let tournamentBracketElement: HTMLElement;
let fontSubsetSearch = '';
let fontSubsetImportText = '';
let fontSubsetImportMessage = '';

$: selectedTournamentFamilies = $tournamentFontFamilies ?? [];
$: selectedTournamentFamilySet = new Set(selectedTournamentFamilies);
$: selectedTournamentFonts = fonts.filter((font) =>
  selectedTournamentFamilySet.has(font.family)
);
$: filteredTournamentFonts = fonts.filter((font) =>
  font.family.toLowerCase().includes(fontSubsetSearch.trim().toLowerCase())
);
$: canStartGame = selectedTournamentFonts.length >= 2;

onMount(() => {
  if ($tournamentFontFamilies === null) {
    $tournamentFontFamilies = fonts
      .filter((font) => font.includeInInitialTournament)
      .map((font) => font.family);
  }

  function handleKeydown(event) {
    if (currentBracket?.players?.length) {
      if (event.key === 'ArrowLeft' || event.keyCode === 37) {
        chooseWinner(currentBracket.players[0], leftButton);
      } else if (event.key === 'ArrowRight' || event.keyCode === 39) {
        chooseWinner(currentBracket.players[1], rightButton);
      }
    }
  }

  window.addEventListener('keydown', handleKeydown);

  // Clean up the event listener when the component is destroyed
  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
});

function startGame() {
  if (!canStartGame) {
    return;
  }

  game = createGame(selectedTournamentFonts);
  currentBracket = game.startGame();
}

function selectAllTournamentFonts() {
  $tournamentFontFamilies = fonts.map((font) => font.family);
}

function selectDefaultTournamentFonts() {
  $tournamentFontFamilies = fonts
    .filter((font) => font.includeInInitialTournament)
    .map((font) => font.family);
}

function clearTournamentFonts() {
  $tournamentFontFamilies = [];
}

function toggleTournamentFont(family: string) {
  if (selectedTournamentFamilySet.has(family)) {
    $tournamentFontFamilies = selectedTournamentFamilies.filter(
      (selectedFamily) => selectedFamily !== family
    );
  } else {
    $tournamentFontFamilies = [...selectedTournamentFamilies, family];
  }
}

function importTournamentFonts() {
  const fontByNormalizedFamily = new Map(
    fonts.map((font) => [font.family.trim().toLowerCase(), font.family])
  );
  const importedFamilies = fontSubsetImportText
    .split(/[\n,;]+/)
    .map((family) => family.trim())
    .filter(Boolean);
  const matchedFamilies = [];
  const missingFamilies = [];

  importedFamilies.forEach((family) => {
    const matchedFamily = fontByNormalizedFamily.get(family.toLowerCase());

    if (matchedFamily) {
      matchedFamilies.push(matchedFamily);
    } else {
      missingFamilies.push(family);
    }
  });

  $tournamentFontFamilies = Array.from(new Set(matchedFamilies));
  fontSubsetImportMessage = `${matchedFamilies.length} matched${
    missingFamilies.length ? `, ${missingFamilies.length} not found` : ''
  }.`;
}

function getFontByFamilyName(familyName: string) {
  return fonts.find((font) => font.family === familyName);
}

function getFontPath(familyName: string) {
  return `${base}/${encodeURIComponent(familyName.replace(/\s+/g, ''))}`;
}

function inlineComputedStyles(source: Element, target: Element) {
  const computedStyle = window.getComputedStyle(source);
  const style = Array.from(computedStyle)
    .map((property) => `${property}:${computedStyle.getPropertyValue(property)}`)
    .join(';');

  target.setAttribute('style', style);
  if (target instanceof HTMLElement) {
    target.style.color = computedStyle.color;
    target.style.webkitTextFillColor = computedStyle.color;
  }

  Array.from(source.children).forEach((sourceChild, index) => {
    const targetChild = target.children[index];
    if (targetChild) {
      inlineComputedStyles(sourceChild, targetChild);
    }
  });
}

function getExportBackgroundColor(element: HTMLElement) {
  let currentElement: HTMLElement | null = element;

  while (currentElement) {
    const backgroundColor =
      window.getComputedStyle(currentElement).backgroundColor;
    if (backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
      return backgroundColor;
    }
    currentElement = currentElement.parentElement;
  }

  return window.getComputedStyle(document.body).backgroundColor || '#ffffff';
}

function createTournamentSvg() {
  if (!tournamentBracketElement) {
    return '';
  }

  const clone = tournamentBracketElement.cloneNode(true) as HTMLElement;
  const backgroundColor = getExportBackgroundColor(tournamentBracketElement);

  inlineComputedStyles(tournamentBracketElement, clone);
  clone.querySelectorAll('[data-font-family]').forEach((element) => {
    const fontFamily = element.getAttribute('data-font-family');
    if (fontFamily) {
      element.textContent = fontFamily;
    }
  });
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';
  clone.style.width = 'max-content';
  clone.style.height = 'max-content';
  clone.style.backgroundColor = backgroundColor;

  const measureContainer = document.createElement('div');
  measureContainer.style.position = 'fixed';
  measureContainer.style.left = '-100000px';
  measureContainer.style.top = '0';
  measureContainer.style.visibility = 'hidden';
  measureContainer.style.pointerEvents = 'none';
  measureContainer.style.width = 'max-content';
  measureContainer.style.height = 'max-content';
  measureContainer.appendChild(clone);
  document.body.appendChild(measureContainer);

  const width = Math.ceil(clone.scrollWidth || clone.getBoundingClientRect().width);
  const height = Math.ceil(
    clone.scrollHeight || clone.getBoundingClientRect().height
  );
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const content = new XMLSerializer().serializeToString(clone);
  measureContainer.remove();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="${backgroundColor}" />
<foreignObject width="100%" height="100%">
${content}
</foreignObject>
</svg>`;
}

function exportTournamentSvg() {
  const svg = createTournamentSvg();
  if (!svg) {
    return;
  }

  const fileName = `${currentBracket?.winner?.family ?? 'coding-font'}-tournament`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${fileName}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

async function chooseWinner(player, button) {
  currentBracket = game.setWinner(player);
  game = game;
  if (currentBracket?.winner) {
    createConfetti();
    $showName = true;
  } else {
    const { x, y, width, height } = button.getBoundingClientRect();
    createConfetti('small', {
      x: (x + width / 2) / window.innerWidth,
      y: (y + height / 2) / window.innerHeight
    });
  }
  await tick();
  scrollToBracket();
}

function scrollToBracket() {
  const winnerElement = document.querySelector('.winner-candidate');
  if (winnerElement) {
    winnerElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const activeBracket = document.querySelector('.font-bracket.active');
  if (activeBracket) {
    activeBracket.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
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
    <Sidebar>
      <div class="flex flex-col gap-2 px-2">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-bold uppercase tracking-wide opacity-70"
            >Font Pool</span>
          <span class="text-sm opacity-70"
            >{selectedTournamentFonts.length}/{fonts.length}</span>
        </div>
        <input
          class="input"
          type="search"
          placeholder="Search fonts"
          bind:value="{fontSubsetSearch}" />
        <div class="grid grid-cols-3 gap-2">
          <button class="variant-soft-surface btn" on:click="{selectAllTournamentFonts}"
            >Select all</button>
          <button
            class="variant-soft-surface btn"
            on:click="{selectDefaultTournamentFonts}">Select Defaults</button>
          <button class="variant-soft-surface btn" on:click="{clearTournamentFonts}"
            >Clear</button>
        </div>
        <textarea
          class="textarea h-24"
          placeholder="Paste font names"
          bind:value="{fontSubsetImportText}"></textarea>
        <button
          class="variant-soft-surface btn"
          disabled="{!fontSubsetImportText.trim()}"
          on:click="{importTournamentFonts}">Import list</button>
        {#if fontSubsetImportMessage}
          <p class="text-sm opacity-70">{fontSubsetImportMessage}</p>
        {/if}
        <div class="table-container max-h-80 overflow-auto rounded-none">
          {#each filteredTournamentFonts as font (font.family)}
            <label
              class="hover:variant-soft-surface flex cursor-pointer items-center gap-2 px-2 py-1">
              <input
                class="checkbox"
                type="checkbox"
                checked="{selectedTournamentFamilySet.has(font.family)}"
                on:change="{() => toggleTournamentFont(font.family)}" />
              <span
                class="truncate"
                style="{getFontStyle(
                  font,
                  $fontOpenTypeFeatures,
                  $fontLigatures
                )}">{font.family}</span>
            </label>
          {/each}
        </div>
      </div>
      <button
        class="variant-filled-primary btn"
        disabled="{!canStartGame}"
        on:click="{startGame}"
        >{game ? 'Restart Game' : 'Start Game'}</button>
      {#if currentBracket?.winner}
        <button
          class="variant-filled-primary btn"
          on:click="{exportTournamentSvg}">
          <IconDownload size="18" />
          <span>Export Tournament</span>
        </button>
      {/if}
      {#if game?.rounds.length}
        <div class="flex items-center gap-2 px-2">
          <span
            class="text-sm font-bold uppercase tracking-wide opacity-70"
            >Tournament Bracket</span>
        </div>
        <div
          bind:this="{tournamentBracketElement}"
          class="table-container rounded-none p-2">
          <div class="font-brackets">
            {#each game.rounds as round, index (round)}
              {#if game.finalRound === index}
                <div class="round-winner">
                  <WinnerBadge>
                    <span
                      style="{getFontStyle(
                        round[0].winner,
                        $fontOpenTypeFeatures,
                        $fontLigatures
                      )}">
                      {round[0].winner.family}
                    </span>
                  </WinnerBadge>
                </div>
              {:else}
                <div class="{`round-${index + 1}`}">
                  {#each round as bracket (bracket)}
                    <div
                      class="font-bracket"
                      class:active="{bracket === currentBracket}">
                      {#each bracket?.players as font (font)}
                        <PlayerBadge
                          class="{bracket?.winner?.family == font.family
                            ? 'variant-ghost-primary'
                            : 'variant-soft-surface'}">
                          <span
                            data-font-family="{font.family}"
                            style="{getFontStyle(
                              font,
                              $fontOpenTypeFeatures,
                              $fontLigatures
                            )}">
                            {$showName ? font.family : 'ABC abc 123'}
                          </span>
                        </PlayerBadge>
                      {/each}
                      <div
                        class="line-bracket {bracket.players.length === 1
                          ? 'bottom-1/2'
                          : ''}">
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    </Sidebar>
  </svelte:fragment>
  <svelte:fragment slot="pageHeader">
    <Controls>
      {#if !$menuOpen}
        <button
          class="variant-filled-primary btn"
          disabled="{!canStartGame}"
          on:click="{startGame}"
          >{game ? 'Restart Game' : 'Start Game'}</button>
        {#if currentBracket?.winner}
          <button
            class="variant-filled-primary btn"
            on:click="{exportTournamentSvg}">
            <IconDownload size="18" />
            <span>Export Tournament</span>
          </button>
        {/if}
      {/if}
    </Controls>
  </svelte:fragment>
  <div
    class="bg-surface-50-900-token grid h-full grid-cols-1 grid-rows-2 gap-4 p-4 md:grid-cols-2 md:grid-rows-1">
    {#if currentBracket?.players?.length}
      <div class="relative flex flex-col gap-4">
        <FontHeader
          font="{getFontByFamilyName(currentBracket.players[0].family)}" />
        <MonacoEditor
          class="overflow-hidden rounded-container-token"
          fontSize="{$fontSize}"
          fontFamily="{currentBracket.players[0].family}"
          fontLigatures="{$fontLigatures}"
          fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
          language="{$editorLanguage}"
          themeName="{$selectedTheme}" />
        <button
          bind:this="{leftButton}"
          class="variant-filled-primary btn absolute bottom-10 block self-center shadow-xl"
          on:click="{(e) =>
            chooseWinner(currentBracket.players[0], leftButton)}"
          >Choose or press <kbd class="kbd">⇽</kbd></button>
      </div>
      <div class="relative flex flex-col gap-4">
        <FontHeader
          font="{getFontByFamilyName(currentBracket.players[1].family)}" />
        <MonacoEditor
          class="overflow-hidden rounded-container-token"
          fontSize="{$fontSize}"
          fontFamily="{currentBracket.players[1].family}"
          fontLigatures="{$fontLigatures}"
          fontOpenTypeFeatures="{$fontOpenTypeFeatures}"
          language="{$editorLanguage}"
          themeName="{$selectedTheme}" />
        <button
          bind:this="{rightButton}"
          class="variant-filled-primary btn absolute bottom-10 block self-center shadow-xl"
          on:click="{(e) =>
            chooseWinner(currentBracket.players[1], rightButton)}"
          >Choose or press <kbd class="kbd">⇾</kbd></button>
      </div>
    {:else if currentBracket?.winner}
      <div
        class="bg-surface-50-900-token border-surface-900-50-token relative col-span-1 row-span-2 border-4 p-6 text-center md:col-span-2 md:row-span-1 md:p-10">
        <img
          class="absolute bottom-0 left-0 right-0 mx-auto opacity-60"
          src="{base}/trophy.png"
          alt="Trophy of Font"
          width="400" />
        <div
          class="relative mx-auto flex max-w-5xl flex-col gap-12 p-4 md:p-10">
          <div
            class="border-surface-700-200-token flex flex-col gap-6 border-t-2 pt-10 tracking-widest">
            <h2 class="h2">CERTIFICATE OF ABSOLUTE AWESOMENESS</h2>
            <h4 class="h4">HEREBY UNLEASHED UPON</h4>
          </div>
          <div
            class="my-4 text-4xl md:text-6xl"
            style="{getFontStyle(
              currentBracket?.winner,
              $fontOpenTypeFeatures,
              $fontLigatures
            )}">
            {currentBracket?.winner.family}
          </div>
          <div class="variant-soft-surface btn-group self-center">
            <a href="{currentBracket?.winner.siteUrl}" target="_blank">
              <IconExternalLink size="24" />
              <span class="hidden 2xl:block"
                >Visit {currentBracket?.winner.family}</span>
            </a>
            <a href="{currentBracket?.winner.downloadUrl}">
              <IconDownload size="24" />
              <span class="hidden 2xl:block"
                >Download {currentBracket?.winner.family}</span>
            </a>
            <a
              href="{getFontPath(currentBracket?.winner.family)}">
              <IconMaximize size="24" />
              <span class="hidden 2xl:block">View Font Detail</span>
            </a>
          </div>
          <h4 class="h4">
            For mastering the art of bézier curve pageantry, where zeros, arrows
            and curly brackets stand heroic in a 10-hour coding crusade! For
            turning each keystroke into a clear, courageous character,
            triumphing in the tumultuous tournament of type!
          </h4>
          <div class="mt-20 hidden justify-between md:flex">
            <div>
              <p class="mb-2">__________________________</p>
              <p class="text-center">HEAD OF DEPARTMENT</p>
            </div>
            <div>
              <p class="mb-2">__________________________</p>
              <p class="text-center">COORDINATOR</p>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div
        class="bg-surface-50-900-token border-surface-900-50-token col-span-1 row-span-2 flex items-center justify-center border-4 p-6 text-center md:col-span-2 md:row-span-1">
        <div class="flex max-w-xl flex-col gap-4">
          <h2 class="h2">Select fonts to start ranking</h2>
          <p class="opacity-70">
            Choose at least two fonts from the sidebar, then start the
            tournament.
          </p>
        </div>
      </div>
    {/if}
  </div>
</AppShell>
