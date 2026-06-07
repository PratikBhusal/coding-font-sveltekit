<script lang="ts">
import {
  DEFAULT_SIDEBAR_WIDTH,
  menuOpen,
  sidebarWidth
} from '$lib/store';

export let alwaysOpen = false;

let sidebar;
let shellSidebar: HTMLElement | null = null;
let startX = 0;
let startWidth = 0;

const minSidebarWidth = 192;

export function scrollToTop() {
  sidebar.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function clampSidebarWidth(width: number) {
  return Math.min(Math.max(width, minSidebarWidth), window.innerWidth);
}

function syncShellSidebarWidth() {
  if (!shellSidebar) return;

  const isOpen = alwaysOpen || $menuOpen;
  shellSidebar.style.width = isOpen ? `${$sidebarWidth}px` : '0px';
  shellSidebar.style.minWidth = isOpen ? `${minSidebarWidth}px` : '0px';
  shellSidebar.style.maxWidth = `${window.innerWidth}px`;
}

function handlePointerMove(event: PointerEvent) {
  $sidebarWidth = clampSidebarWidth(startWidth + event.clientX - startX);
  syncShellSidebarWidth();
}

function handlePointerUp() {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
}

function startResize(event: PointerEvent) {
  $menuOpen = true;
  startX = event.clientX;
  startWidth = shellSidebar?.getBoundingClientRect().width || $sidebarWidth;
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function resetSidebarWidth() {
  $menuOpen = true;
  $sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
  syncShellSidebarWidth();
}

$: if (sidebar) {
  shellSidebar = sidebar.parentElement;
  syncShellSidebarWidth();
}

$: {
  $menuOpen;
  $sidebarWidth;
  alwaysOpen;
  syncShellSidebarWidth();
}
</script>

<div
  bind:this="{sidebar}"
  class="bg-surface-100-800-token absolute z-20 flex h-full w-full flex-col gap-4 overflow-y-auto overflow-x-hidden border-r border-surface-400 p-4 pr-5 dark:border-surface-500 lg:static"
  class:hidden="{!alwaysOpen && !$menuOpen}">
  <slot />
  <button
    type="button"
    aria-label="Resize sidebar"
    title="Drag to resize. Double-click to reset width."
    class="group absolute right-0 top-0 hidden h-full w-3 cursor-col-resize touch-none lg:block"
    on:pointerdown="{startResize}"
    on:dblclick="{resetSidebarWidth}">
    <span
      class="bg-surface-400-500-token group-hover:bg-primary-500 group-active:bg-primary-600 absolute right-0 top-0 h-full w-1">
    </span>
  </button>
</div>
