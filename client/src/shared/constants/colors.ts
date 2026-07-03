import { useThemeStore } from '../store/themeStore';

export const LightTheme = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#F3F4F6',   // Soft light gray background (less glaring)
  surface:         '#FFFFFF',   // White surface for cards
  surfaceElevated: '#FFFFFF',   // Elevated cards, modals
  surfaceInput:    '#E5E7EB',   // Slightly darker gray for inputs

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#0084FF',   // Messenger Blue
  primaryDim:      'rgba(0, 132, 255, 0.1)',

  // ── Text ──────────────────────────────────────────────────
  text:            '#111827',   // Soft black (less harsh)
  textSecondary:   '#6B7280',   // Gray secondary text
  textMuted:       '#9CA3AF',   // Light gray/muted

  // ── Status ────────────────────────────────────────────────
  online:          '#34C759',   // iOS Green
  danger:          '#FF3B30',   // iOS Red
  success:         '#34C759',

  // ── Separators ────────────────────────────────────────────
  divider:         '#D1D5DB',

  // ── Chat bubbles ──────────────────────────────────────────
  myBubble:        '#0084FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#E5E5EA',
  theirBubbleText: '#111827',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(0,0,0,0.5)',
} as const;

export const DarkTheme = {
  // ── Backgrounds ───────────────────────────────────────────
  bg:              '#000000',   // Pure black background
  surface:         '#121212',   // Very dark gray surface
  surfaceElevated: '#1C1C1E',   // Elevated cards, modals
  surfaceInput:    '#1C1C1E',   // Dark input fields

  // ── Brand ─────────────────────────────────────────────────
  primary:         '#0084FF',   // Messenger Blue
  primaryDim:      'rgba(0, 132, 255, 0.2)',

  // ── Text ──────────────────────────────────────────────────
  text:            '#FFFFFF',   // Pure white text
  textSecondary:   '#A1A1A6',   // Gray secondary text
  textMuted:       '#636366',   // Dark gray/muted

  // ── Status ────────────────────────────────────────────────
  online:          '#32D74B',   // iOS Green (Dark)
  danger:          '#FF453A',   // iOS Red (Dark)
  success:         '#32D74B',

  // ── Separators ────────────────────────────────────────────
  divider:         '#38383A',

  // ── Chat bubbles ──────────────────────────────────────────
  myBubble:        '#0084FF',
  myBubbleText:    '#FFFFFF',
  theirBubble:     '#2C2C2E',
  theirBubbleText: '#FFFFFF',

  // ── Transparent overlays ──────────────────────────────────
  overlay:         'rgba(0,0,0,0.7)',
} as const;

// Backward compatibility for files that haven't migrated yet
export const Colors = DarkTheme; 

export const useTheme = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  return isDarkMode ? DarkTheme : LightTheme;
};
