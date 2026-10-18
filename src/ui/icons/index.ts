import type { DiceType } from "@/types";

/**
 * High-quality polyhedral dice SVG silhouettes with geometric facet edges.
 * Scaled neatly inside a 32x32 viewport.
 */
export const DICE_SVGS: Record<DiceType, string> = {
  // D4: Tetrahedron with apex and 3 visible facets meeting at the center
  d4: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,3 29,27 3,27" fill="currentColor" fill-opacity="0.12" />
      <line x1="16" y1="3" x2="16" y2="19" />
      <line x1="3" y1="27" x2="16" y2="19" />
      <line x1="29" y1="27" x2="16" y2="19" />
    </svg>
  `,

  // D6: Cube in isometric projection with 3 visible square/rhombus facets
  d6: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,3 28,10 28,23 16,30 4,23 4,10" fill="currentColor" fill-opacity="0.12" />
      <line x1="16" y1="16.5" x2="16" y2="30" />
      <line x1="16" y1="16.5" x2="4" y2="10" />
      <line x1="16" y1="16.5" x2="28" y2="10" />
    </svg>
  `,

  // D8: Octahedron diamond with top & bottom apexes and center ridge
  d8: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,2 29,16 16,30 3,16" fill="currentColor" fill-opacity="0.12" />
      <line x1="3" y1="16" x2="29" y2="16" />
      <line x1="16" y1="2" x2="16" y2="30" />
      <line x1="16" y1="2" x2="16" y2="16" stroke-width="2.2" />
    </svg>
  `,

  // D10: Pentagonal Trapezohedron with deltoid kite facets and offset equatorial ring
  d10: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,2 28,11 24,27 8,27 4,11" fill="currentColor" fill-opacity="0.12" />
      <line x1="16" y1="2" x2="16" y2="18" />
      <line x1="4" y1="11" x2="16" y2="18" />
      <line x1="28" y1="11" x2="16" y2="18" />
      <line x1="8" y1="27" x2="16" y2="18" />
      <line x1="24" y1="27" x2="16" y2="18" />
    </svg>
  `,

  // D12: Dodecahedron with central regular pentagon and 5 surrounding facet borders
  d12: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,2 26,6 30,16 24,26 16,30 8,26 2,16 6,6" fill="currentColor" fill-opacity="0.12" />
      <!-- Central pentagon -->
      <polygon points="16,9 23,14 20,22 12,22 9,14" fill="currentColor" fill-opacity="0.18" />
      <!-- Radial edges to outer perimeter -->
      <line x1="16" y1="9" x2="16" y2="2" />
      <line x1="23" y1="14" x2="30" y2="16" />
      <line x1="20" y1="22" x2="24" y2="26" />
      <line x1="12" y1="22" x2="8" y2="26" />
      <line x1="9" y1="14" x2="2" y2="16" />
    </svg>
  `,

  // D20: Icosahedron with central inverted triangle and surrounding facet network
  d20: `
    <svg viewBox="0 0 32 32" class="dice-svg" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="16,2 29,9 29,23 16,30 3,23 3,9" fill="currentColor" fill-opacity="0.12" />
      <!-- Central prominent triangle -->
      <polygon points="16,23 26,10 6,10" fill="currentColor" fill-opacity="0.22" stroke-width="2" />
      <!-- Edges from central triangle to outer vertices -->
      <line x1="16" y1="2" x2="6" y2="10" />
      <line x1="16" y1="2" x2="26" y2="10" />
      <line x1="26" y1="10" x2="29" y2="9" />
      <line x1="26" y1="10" x2="29" y2="23" />
      <line x1="16" y1="23" x2="29" y2="23" />
      <line x1="16" y1="23" x2="16" y2="30" />
      <line x1="16" y1="23" x2="3" y2="23" />
      <line x1="6" y1="10" x2="3" y2="23" />
      <line x1="6" y1="10" x2="3" y2="9" />
    </svg>
  `,
};

export const UI_ICONS = {
  dice: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>`,
  history: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l2.4 7.2L21.6 12l-7.2 2.4L12 21.6l-2.4-7.2L2.4 12l7.2-2.4z"/></svg>`,
  cameraReset: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  info: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
};
