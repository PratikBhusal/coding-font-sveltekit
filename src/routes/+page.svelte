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

onMount(async () => {
  if ($tournamentFontFamilies === null) {
    $tournamentFontFamilies = fonts.map((font) => font.family);
  }

  await tick();
  startGame();

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

function startGame(closeSidebar = false) {
  if (!canStartGame) {
    return;
  }

  // Capture old game state before replacing it so
  // the first start is not treated as a restart.
  const isRestarting = Boolean(game);
  game = createGame(selectedTournamentFonts);
  currentBracket = game.startGame();

  if (isRestarting && closeSidebar) {
    $menuOpen = false;
  }
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

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCssFontFamily(font: CodingFont) {
  const family = font.family.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `'${family}', ui-monospace, monospace`;
}

function getCssMonospaceFallback() {
  return 'ui-monospace, monospace';
}

function getSvgFontFamily(font: CodingFont) {
  return escapeXml(getCssFontFamily(font));
}

function createTournamentSvg() {
  if (!game?.rounds?.length || !currentBracket?.winner) {
    return '';
  }

  const rounds = game.rounds;
  const hasTerminalWinnerRound =
    rounds.length > 1 &&
    rounds[rounds.length - 1]?.length === 1 &&
    rounds[rounds.length - 1][0]?.players?.length === 1;
  const visibleRounds = hasTerminalWinnerRound
    ? rounds.slice(0, -1)
    : rounds;
  const bracketFonts = Array.from(
    new Map(
      visibleRounds
        .flatMap((round) => round.flatMap((bracket) => bracket.players))
        .concat(currentBracket.winner)
        .map((font) => [font.family, font])
    ).values()
  );
  // Outer whitespace around the whole exported SVG.
  const padding = 0;
  // First round/player positions anchor bracket tree indexing.
  const firstRoundIndex = 0;
  const firstPlayerIndex = 0;
  // One-player brackets represent byes or the terminal winner round.
  const singlePlayerCount = 1;
  // Second player offset is used for two-player matchup lookups.
  const secondPlayerIndex = firstPlayerIndex + singlePlayerCount;
  // Tournament brackets pair two entrants before advancing one winner.
  const playersPerBracket = 2;
  // Used wherever the layout needs a visual center point.
  const midpointDivisor = 2;
  // Use the font size selected in the controls so exports match the UI choice.
  const championTextFontSize = $fontSize;
  // Ratios are based on the original SVG label size before export scaling.
  const baseLabelFontSize = 14;
  // Layout dimensions are derived from the label scale instead of standalone px.
  const layoutUnit = championTextFontSize;
  const scaleLayout = (multiplier: number) =>
    Math.round(layoutUnit * multiplier);
  // Hidden SVG is only used for measurement, so it should not occupy space.
  const hiddenMeasurementSvgSize = 0;
  // Fallback estimate for average monospace glyph width when browser SVG
  // measurement is unavailable. Most monospace glyphs are roughly 0.6em wide.
  const fallbackMonospaceGlyphWidthEm = 0.6;
  // Connector line thickness between bracket rounds.
  const connectorStrokeWidth = scaleLayout(2 / baseLabelFontSize);
  // Corner radius for player, winner, and label rectangles.
  const rectRadius = scaleLayout(4 / baseLabelFontSize);
  // Player rows use the smaller label text.
  const playerTextFontSize = scaleLayout(13 / baseLabelFontSize);
  // Font names are left-aligned with a small inset inside their rectangles.
  const fontNameTextInset = scaleLayout(12 / baseLabelFontSize);
  // Height of the purple "Winner" header pill.
  const championLabelHeight = scaleLayout(24 / baseLabelFontSize);
  // Places the winner header above the winner font row.
  const championLabelOffset = scaleLayout(32 / baseLabelFontSize);
  // Font size for the "Winner" header text.
  const championLabelFontSize = scaleLayout(12 / baseLabelFontSize);
  // Places the winner font row below the winner header.
  const championNameOffset = scaleLayout(4 / baseLabelFontSize);
  // Height of the winner font row.
  const championNameHeight = scaleLayout(36 / baseLabelFontSize);
  // Keeps the "Winner" header visually distinct from font names.
  const championLabelFontWeight = 700;
  // Measure against the larger label size used in the SVG so one shared rect
  // width can fit both player labels and the final winner label.
  const measuredLabelFontSize = championTextFontSize;
  const fontNameMeasurements = bracketFonts.map((font) =>
    measureSvgTextBounds(font.family, measuredLabelFontSize, [
      getCssFontFamily(font),
      getCssMonospaceFallback()
    ])
  );
  const bracketWidth = Math.ceil(
    Math.max(...fontNameMeasurements.map((measurement) => measurement.right)) +
      fontNameTextInset
  );
  const championWidth = bracketWidth;
  const strokeColor = '#6366f1';
  const textColor = '#171717';
  const primaryTextColor = '#4a4db5';
  const surfaceColor = '#f3f4f6';
  const winnerColor = '#e8e8fd';
  const winnerStrokeColor = '#6366f1';
  // Row height tracks the label scale so text remains vertically balanced.
  const playerHeight = scaleLayout(30 / baseLabelFontSize);
  // Vertical gap between two players inside the same matchup.
  const playerGap = scaleLayout(8 / baseLabelFontSize);
  // Vertical gap between separate matchups in the same round.
  const bracketGap = scaleLayout(22 / baseLabelFontSize);
  // Horizontal gap reserved for connector lines between rounds.
  const roundGap = scaleLayout(6);
  const bracketHeight = playerHeight * playersPerBracket + playerGap;
  const bracketStep = bracketHeight + bracketGap;
  const roundCenters = [];

  function getRoundDefaultCenter(bracketIndex: number) {
    return padding + bracketHeight / midpointDivisor + bracketIndex * bracketStep;
  }

  function getBracketSourceSlots(bracket, bracketIndex: number) {
    return (
      bracket.sourceSlots ?? [
        bracketIndex * playersPerBracket,
        bracketIndex * playersPerBracket + secondPlayerIndex
      ]
    );
  }

  roundCenters[firstRoundIndex] = visibleRounds[firstRoundIndex].map(
    (_, index) => getRoundDefaultCenter(index)
  );

  for (
    let roundIndex = firstRoundIndex + 1;
    roundIndex < visibleRounds.length;
    roundIndex++
  ) {
    roundCenters[roundIndex] = visibleRounds[roundIndex].map(
      (bracket, bracketIndex) => {
        const sourceCenters = getBracketSourceSlots(bracket, bracketIndex).map(
          (sourceSlot) =>
            roundCenters[roundIndex - 1][sourceSlot] ??
            getRoundDefaultCenter(sourceSlot)
        );

        if (sourceCenters.length === 0) {
          return getRoundDefaultCenter(bracketIndex);
        }

        return (
          sourceCenters.reduce((total, center) => total + center, 0) /
          sourceCenters.length
        );
      }
    );
  }

  const finalRoundIndex = visibleRounds.length - 1;
  const champion = currentBracket.winner;
  const championCenter = roundCenters[finalRoundIndex][0];
  const width =
    padding * 2 +
    visibleRounds.length * bracketWidth +
    visibleRounds.length * roundGap +
    championWidth;
  const bracketBottoms = visibleRounds.flatMap((round, roundIndex) =>
    round.map((bracket, bracketIndex) => {
      const renderedHeight =
        bracket.players.length === singlePlayerCount
          ? playerHeight
          : bracketHeight;

      return (
        roundCenters[roundIndex][bracketIndex] +
        renderedHeight / midpointDivisor
      );
    })
  );
  const championBottom = Math.max(
    championCenter - championLabelOffset + championLabelHeight,
    championCenter - championNameOffset + championNameHeight
  );
  const height = padding + Math.max(...bracketBottoms, championBottom);
  const defs = [];
  const output = [];
  let clipId = 0;

  function getRoundX(roundIndex: number) {
    return padding + roundIndex * (bracketWidth + roundGap);
  }

  function measureSvgTextBounds(
    value: string,
    fontSize: number,
    fontFamilies: string[]
  ) {
    // Fallback estimate for average monospace glyph width when browser SVG
    // measurement is unavailable. Most monospace glyphs are roughly 0.6em wide.
    if (typeof document === 'undefined') {
      return {
        left: 0,
        right: value.length * fontSize * fallbackMonospaceGlyphWidthEm
      };
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    svg.setAttribute('width', String(hiddenMeasurementSvgSize));
    svg.setAttribute('height', String(hiddenMeasurementSvgSize));
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    svg.style.overflow = 'visible';
    document.body.appendChild(svg);

    try {
      const measurements = fontFamilies.map((fontFamily) => {
        const text = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'text'
        );

        text.setAttribute('x', '0');
        text.setAttribute('y', '0');
        text.setAttribute('font-size', String(fontSize));
        text.setAttribute('font-family', fontFamily);
        text.textContent = value;
        svg.appendChild(text);

        const bounds = text.getBBox();

        text.remove();

        return {
          left: Math.max(0, -bounds.x),
          right: bounds.x + bounds.width
        };
      });

      return {
        left: Math.max(...measurements.map((measurement) => measurement.left)),
        right: Math.max(...measurements.map((measurement) => measurement.right))
      };
    } catch {
      return {
        left: 0,
        right: value.length * fontSize * fallbackMonospaceGlyphWidthEm
      };
    } finally {
      svg.remove();
    }
  }

  function renderLine(x1: number, y1: number, x2: number, y2: number) {
    output.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${connectorStrokeWidth}" />`
    );
  }

  function renderPlayer(font: CodingFont, x: number, y: number, isWinner: boolean) {
    const fontFamily = getSvgFontFamily(font);
    const family = escapeXml(font.family);
    const textClipId = `font-label-${clipId++}`;
    const textY = y + playerHeight / midpointDivisor;

    defs.push(
      `<clipPath id="${textClipId}"><rect x="${x}" y="${y}" width="${bracketWidth}" height="${playerHeight}" /></clipPath>`
    );
    output.push(`<g>
<rect x="${x}" y="${y}" width="${bracketWidth}" height="${playerHeight}" rx="${rectRadius}" fill="${isWinner ? winnerColor : surfaceColor}" stroke="${isWinner ? winnerStrokeColor : strokeColor}" />
<text x="${x + fontNameTextInset}" y="${textY}" dominant-baseline="middle" fill="${isWinner ? primaryTextColor : textColor}" font-size="${playerTextFontSize}" font-family="${fontFamily}" clip-path="url(#${textClipId})">${family}</text>
</g>`);
  }

  function renderBracket(bracket, roundIndex: number, bracketIndex: number) {
    const x = getRoundX(roundIndex);
    const center = roundCenters[roundIndex][bracketIndex];
    const players = bracket.players;

    if (players.length === singlePlayerCount) {
      renderPlayer(
        players[firstPlayerIndex],
        x,
        center - playerHeight / midpointDivisor,
        true
      );
      return;
    }

    players.forEach((font, playerIndex) => {
      const y =
        playerIndex === firstPlayerIndex
          ? center - playerGap / midpointDivisor - playerHeight
          : center + playerGap / midpointDivisor;
      renderPlayer(font, x, y, bracket?.winner?.family === font.family);
    });
  }

  visibleRounds.forEach((round, roundIndex) => {
    if (roundIndex === firstRoundIndex) {
      return;
    }

    round.forEach((bracket, bracketIndex) => {
      const previousRoundIndex = roundIndex - 1;
      const previousX = getRoundX(previousRoundIndex) + bracketWidth;
      const targetX = getRoundX(roundIndex);
      const joinX = previousX + roundGap / midpointDivisor;
      const targetY = roundCenters[roundIndex][bracketIndex];
      const sourceYs = getBracketSourceSlots(bracket, bracketIndex)
        .map((sourceSlot) => roundCenters[previousRoundIndex][sourceSlot])
        .filter((center) => Number.isFinite(center));

      if (sourceYs.length === 0) {
        return;
      }

      if (sourceYs.length === singlePlayerCount) {
        const sourceY = sourceYs[firstPlayerIndex];

        renderLine(previousX, sourceY, joinX, sourceY);
        renderLine(joinX, sourceY, joinX, targetY);
        renderLine(joinX, targetY, targetX, targetY);
        return;
      }

      sourceYs.forEach((sourceY) => renderLine(previousX, sourceY, joinX, sourceY));
      renderLine(
        joinX,
        sourceYs[firstPlayerIndex],
        joinX,
        sourceYs[secondPlayerIndex]
      );
      renderLine(joinX, targetY, targetX, targetY);
    });
  });

  visibleRounds.forEach((round, roundIndex) => {
    round.forEach((bracket, bracketIndex) => {
      renderBracket(bracket, roundIndex, bracketIndex);
    });
  });

  const finalX = getRoundX(finalRoundIndex) + bracketWidth;
  const championX = finalX + roundGap;
  const championClipId = `font-label-${clipId++}`;
  const championLabelY = championCenter - championLabelOffset;
  const championLabelTextX = championX + championWidth / midpointDivisor;
  const championLabelTextY = championLabelY + championLabelHeight / midpointDivisor;
  const championNameY = championCenter - championNameOffset;
  const championTextY = championNameY + championNameHeight / midpointDivisor;
  renderLine(finalX, championCenter, championX, championCenter);

  defs.push(
    `<clipPath id="${championClipId}"><rect x="${championX}" y="${championNameY}" width="${championWidth}" height="${championNameHeight}" /></clipPath>`
  );
  output.push(`<g>
<rect x="${championX}" y="${championLabelY}" width="${championWidth}" height="${championLabelHeight}" rx="${rectRadius}" fill="${winnerStrokeColor}" />
<text x="${championLabelTextX}" y="${championLabelTextY}" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="${championLabelFontSize}" font-weight="${championLabelFontWeight}" font-family="ui-monospace, monospace">Winner</text>
<rect x="${championX}" y="${championNameY}" width="${championWidth}" height="${championNameHeight}" rx="${rectRadius}" fill="${winnerColor}" stroke="${winnerStrokeColor}" />
<text x="${championX + fontNameTextInset}" y="${championTextY}" dominant-baseline="middle" fill="${primaryTextColor}" font-size="${championTextFontSize}" font-family="${getSvgFontFamily(champion)}" clip-path="url(#${championClipId})">${escapeXml(champion.family)}</text>
</g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
${defs.join('\n')}
</defs>
${output.join('\n')}
</svg>`;
}

async function exportTournamentSvg() {
  await document.fonts?.ready;

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

function chooseWinner(player, button) {
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
        <div class="flex flex-wrap gap-2">
          <button
            class="variant-soft-surface btn flex-1"
            on:click="{selectAllTournamentFonts}"
            >All</button>
          <button
            class="variant-soft-surface btn flex-1"
            on:click="{selectDefaultTournamentFonts}">Curated</button>
          <button
            class="variant-soft-surface btn flex-1"
            on:click="{clearTournamentFonts}"
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
        class="variant-filled-primary btn lg:hidden"
        disabled="{!canStartGame}"
        on:click="{() => startGame(true)}"
        >{game ? 'Restart Game' : 'Start Game'}</button>
      <button
        class="variant-filled-primary btn hidden lg:flex"
        disabled="{!canStartGame}"
        on:click="{() => startGame(false)}"
        >{game ? 'Restart Game' : 'Start Game'}</button>
      {#if currentBracket?.winner}
        <button
          class="variant-filled-primary btn"
          on:click="{exportTournamentSvg}">
          <IconDownload size="18" />
          <span>Export Tournament</span>
        </button>
      {/if}
    </Sidebar>
  </svelte:fragment>
  <svelte:fragment slot="pageHeader">
    <Controls>
      {#if !$menuOpen}
        <button
          class="variant-filled-primary btn"
          disabled="{!canStartGame}"
          on:click="{() => startGame(false)}"
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
    {/if}
  </div>
</AppShell>
