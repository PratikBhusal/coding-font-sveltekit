import { writable, type Writable } from 'svelte/store';
import { localStorageStore } from '@skeletonlabs/skeleton';
import { TournamentEliminationMode } from './game';
import type { CodingFont } from './codingFonts';

export type SavedTournamentMatch = {
  players?: CodingFont[];
  winner?: CodingFont | null;
  loser?: CodingFont | null;
};

export type SavedTournamentResult = {
  version: 1;
  completedAt: string;
  game: {
    eliminationMode: TournamentEliminationMode;
    rounds: SavedTournamentMatch[][];
    winnersRounds?: SavedTournamentMatch[][];
    losersRounds?: SavedTournamentMatch[][];
    finalRounds?: SavedTournamentMatch[][];
  };
  currentBracket: {
    winner: CodingFont;
  };
  totalPlayableMatches: number;
};

export const selectedTheme: Writable<string> = localStorageStore(
  'selectedTheme',
  'brilliance-black'
);

export const fontSize: Writable<number> = localStorageStore('fontSize', 20);

export const fontFamily: Writable<string> = localStorageStore(
  'fontFamily',
  'Fira Code'
);

export const fontFamilyRight: Writable<string> = localStorageStore(
  'fontFamilyRight',
  'Fira Code'
);

export const fontLigatures: Writable<boolean> = localStorageStore(
  'fontLigatures',
  true
);

export const fontOpenTypeFeatures: Writable<boolean> = localStorageStore(
  'fontOpenTypeFeatures',
  true
);

export const editorLanguage: Writable<string> = localStorageStore(
  'editorLanguage',
  'typescript'
);

export const searchTerm: Writable<string> = localStorageStore('searchTerm', '');

export const menuOpen: Writable<boolean> = localStorageStore('menuOpen', false);

export const DEFAULT_SIDEBAR_WIDTH = 480;

export const sidebarWidth: Writable<number> = localStorageStore(
  'sidebarWidth',
  DEFAULT_SIDEBAR_WIDTH
);

export const showName: Writable<boolean> = localStorageStore('showName', false);

export const tournamentFontFamilies: Writable<string[] | null> =
  localStorageStore('tournamentFontFamilies', null);

export const tournamentEliminationMode: Writable<TournamentEliminationMode> =
  localStorageStore(
    'tournamentEliminationMode',
    TournamentEliminationMode.Double
  );

export const savedTournamentResult: Writable<SavedTournamentResult | null> =
  localStorageStore('savedTournamentResult', null);
