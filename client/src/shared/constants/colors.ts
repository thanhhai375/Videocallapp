import { useThemeStore } from '../store/themeStore';

export const darkTheme = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#000000',   // Page background
  surface:         '#1C1E21',   // Card / tab bar / header
  surfaceElevated: '#242526',   // Elevated cards, modals
  surfaceInput:    '#3A3B3C',   // Input fields

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#0A84FF',   // Messenger blue (was #0084FF)
  primaryDim:      'rgba(10,132,255,0.15)',

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
  myBubble:        '#0A84FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#3A3B3C',
  theirBubbleText: '#E4E6EB',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(0,0,0,0.6)',
} as const;

export const lightTheme = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#FFFFFF',   // Page background
  surface:         '#F0F2F5',   // Card / tab bar / header
  surfaceElevated: '#FFFFFF',   // Elevated cards, modals
  surfaceInput:    '#E4E6EB',   // Input fields

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#0A84FF',   // Messenger blue
  primaryDim:      'rgba(10,132,255,0.15)',

  // ── Text ──────────────────────────────────────────────────
  text:            '#050505',   // Primary text
  textSecondary:   '#65676B',   // Secondary / subtitle
  textMuted:       '#8D949E',   // Timestamps, placeholders

  // ── Status ────────────────────────────────────────────────
  online:          '#31A24C',   // Green online dot
  danger:          '#FA3E3E',   // Red / decline
  success:         '#31A24C',

  // ── Separators ────────────────────────────────────────────
  divider:         '#CED0D4',

  // ── Chat bubbles ──────────────────────────────────────────
  myBubble:        '#0A84FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#E4E6EB',
  theirBubbleText: '#050505',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(255,255,255,0.6)',
} as const;

// Helper hook
export const useTheme = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  return isDarkMode ? darkTheme : lightTheme;
};

// Fallback legacy export to prevent immediate crashes before all files are refactored
export const Colors = darkTheme;
