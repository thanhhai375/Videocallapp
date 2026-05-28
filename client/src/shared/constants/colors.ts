/**
 * Messenger Dark color palette — single source of truth for all colors.
 * Components MUST import from here, never hardcode hex values.
 */
export const Colors = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#000000',   // Page background
  surface:         '#1C1E21',   // Card / tab bar / header
  surfaceElevated: '#242526',   // Elevated cards, modals
  surfaceInput:    '#3A3B3C',   // Input fields

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#0084FF',   // Messenger blue
  primaryDim:      'rgba(0,132,255,0.15)',

  // ── Text ──────────────────────────────────────────────────
  text:            '#E4E6EB',   // Primary text
  textSecondary:   '#B0B3B8',   // Secondary / subtitle
  textMuted:       '#65676B',   // Timestamps, placeholders

  // ── Status ────────────────────────────────────────────────
  online:          '#31A24C',   // Green online dot
  danger:          '#FA3E3E',   // Red / decline
  success:         '#31A24C',

  // ── Separators ────────────────────────────────────────────
  divider:         '#3E4042',

  // ── Chat bubbles ──────────────────────────────────────────
  myBubble:        '#0084FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#3A3B3C',
  theirBubbleText: '#E4E6EB',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(0,0,0,0.6)',
} as const;
