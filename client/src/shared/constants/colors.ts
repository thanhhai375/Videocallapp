/**
 * VideoCall App Blue Dark color palette — single source of truth for all colors.
 * Components MUST import from here, never hardcode hex values.
 */
export const Colors = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#000814',   // Deep dark blue background
  surface:         '#001D3D',   // Dark blue surface
  surfaceElevated: '#003566',   // Elevated cards, modals
  surfaceInput:    '#001D3D',   // Input fields

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#00A3FF',   // Vibrant Electric Blue
  primaryDim:      'rgba(0, 163, 255, 0.15)',

  // ── Text ──────────────────────────────────────────────────
  text:            '#F8FAFC',   // Off-white primary text
  textSecondary:   '#BAE6FD',   // Light blue secondary text
  textMuted:       '#38B2AC',   // Teal/muted blue

  // ── Status ────────────────────────────────────────────────
  online:          '#10B981',   // Emerald
  danger:          '#EF4444',   // Red
  success:         '#10B981',

  // ── Separators ────────────────────────────────────────────
  divider:         '#003566',

  // ── Chat bubbles ──────────────────────────────────────────
  myBubble:        '#00A3FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#003566',
  theirBubbleText: '#F8FAFC',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(0,0,0,0.7)',
} as const;
