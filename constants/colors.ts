export const Colors = {
  // Brand
  primary: '#7c3aed',
  primaryLight: '#9f62f0',
  primaryDark: '#5b21b6',
  gold: '#C9A03C',
  goldLight: '#e0ba5a',

  // Backgrounds
  background: '#0a0a0a',
  surface: '#1a1a1a',
  card: '#222222',
  cardBorder: '#2a2a2a',
  elevated: '#2d2d2d',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#606060',
  textOnPrimary: '#ffffff',

  // Status
  success: '#22c55e',
  successBg: '#14532d',
  warning: '#f59e0b',
  warningBg: '#451a03',
  error: '#ef4444',
  errorBg: '#450a0a',
  pending: '#f59e0b',
  accepted: '#22c55e',
  completed: '#7c3aed',
  cancelled: '#ef4444',

  // UI
  border: '#2a2a2a',
  divider: '#1f1f1f',
  inputBg: '#1f1f1f',
  inputBorder: '#333333',
  placeholder: '#555555',
  overlay: 'rgba(0,0,0,0.7)',
  tabBar: '#111111',
  tabBarBorder: '#1f1f1f',

  // Gradients (used as array values)
  gradientPrimary: ['#7c3aed', '#5b21b6'] as const,
  gradientDark: ['#1a1a1a', '#0a0a0a'] as const,
  gradientCard: ['#222222', '#1a1a1a'] as const,
  gradientHero: ['transparent', '#0a0a0a'] as const,
};

export type ColorKey = keyof typeof Colors;
