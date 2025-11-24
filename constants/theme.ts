/**
 * Theme configuration for HSS Spares app
 * Colors inspired by the HSS website (blue/white theme)
 */

export const colors = {
  primary: '#1e3a8a', // Deep blue - main brand color
  primaryLight: '#3b82f6', // Lighter blue for accents
  primaryDark: '#1e40af', // Darker blue for pressed states
  secondary: '#0ea5e9', // Sky blue for secondary actions
  background: '#ffffff',
  surface: '#f8fafc',
  surfaceElevated: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  textLight: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: colors.textSecondary,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
} as const;

export type Theme = typeof theme;

