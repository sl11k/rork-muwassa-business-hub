export const theme = {
  colors: {
    light: {
      bg: '#FFFFFF',
      surface: '#F7F8FA',
      card: '#FCFCFD',
      border: '#E7EAF0',
      textPrimary: '#101828',
      textSecondary: '#475467',
      textMuted: '#667085',
      primary: '#0F8B8D',
      primaryHover: '#0C6F70',
      primaryLight: 'rgba(15,139,141,0.10)',
      secondary: '#1D4ED8',
      secondaryHover: '#1E40AF',
      secondaryLight: 'rgba(29,78,216,0.10)',
      gold: '#C8A96B',
      success: '#12B76A',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#2563EB',
      iconInactive: '#98A2B3',
      iconActive: '#0F8B8D',
    },
    dark: {
      bg: '#000000',
      surface: '#0B0F14',
      card: '#111827',
      border: 'rgba(255,255,255,0.08)',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#94A3B8',
      primary: '#2DD4BF',
      primaryHover: '#14B8A6',
      primaryLight: 'rgba(45,212,191,0.15)',
      secondary: '#3B82F6',
      secondaryHover: '#2563EB',
      secondaryLight: 'rgba(59,130,246,0.15)',
      gold: '#D6B97A',
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#F87171',
      info: '#60A5FA',
      iconInactive: '#64748B',
      iconActive: '#2DD4BF',
    },
  },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' as const },
    h2: { fontSize: 17, fontWeight: '600' as const },
    h3: { fontSize: 15, fontWeight: '600' as const },
    body: { fontSize: 15, fontWeight: '400' as const },
    bodySemibold: { fontSize: 15, fontWeight: '600' as const },
    caption: { fontSize: 13, fontWeight: '400' as const },
    captionSemibold: { fontSize: 13, fontWeight: '600' as const },
    small: { fontSize: 12, fontWeight: '400' as const },
    label: { fontSize: 11, fontWeight: '600' as const, textTransform: 'uppercase' as const },
  },
  shadow: {
    sm: {
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    } as const,
    md: {
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    } as const,
    lg: {
      shadowColor: '#000000',
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    } as const,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    screenPadding: 16,
  },
};

export const AVATAR_COLORS = [
  '#0F8B8D',
  '#1D4ED8',
  '#12B76A',
  '#C8A96B',
  '#0C6F70',
  '#1E40AF',
  '#14B8A6',
  '#2563EB',
];

export function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export type Theme = typeof theme;
