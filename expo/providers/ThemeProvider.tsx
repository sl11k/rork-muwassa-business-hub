import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';

export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'business-hub-theme-mode';

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgMuted: string;
  bgSecondary: string;
  bgGrouped: string;
  bgElevated: string;
  bgDark: string;
  bgDarkCard: string;
  bgDarkMuted: string;
  accent: string;
  accentLight: string;
  accentSoft: string;
  accentSoft2: string;
  accentDark: string;
  teal: string;
  tealLight: string;
  orange: string;
  orangeLight: string;
  indigo: string;
  indigoLight: string;
  pink: string;
  pinkLight: string;
  mint: string;
  mintLight: string;
  cyan: string;
  cyanLight: string;
  yellow: string;
  yellowLight: string;
  rose: string;
  roseLight: string;
  sky: string;
  skyLight: string;
  gold: string;
  goldLight: string;
  navy: string;
  navyLight: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;
  textOnDark: string;
  textOnDarkMuted: string;
  white: string;
  black: string;
  separator: string;
  separatorLight: string;
  opaqueSeparator: string;
  fill: string;
  secondaryFill: string;
  tertiaryFill: string;
  overlay: string;
  skeleton: string;
  skeletonHighlight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  destructive: string;
  border: string;
  borderLight: string;
  divider: string;
  glass: string;
  glassLight: string;
  gradientStart: string;
  gradientEnd: string;
  tabBarBg: string;
  tabBarBorder: string;
  cardShadow: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  badgeBg: string;
  shimmer: string;
}

const darkColors: ThemeColors = {
  bg: '#09090B',
  bgCard: '#141417',
  bgMuted: '#1A1A1F',
  bgSecondary: '#101013',
  bgGrouped: '#09090B',
  bgElevated: '#1E1E24',
  bgDark: '#050507',
  bgDarkCard: '#101013',
  bgDarkMuted: '#141417',
  accent: '#E8A838',
  accentLight: 'rgba(232,168,56,0.14)',
  accentSoft: 'rgba(232,168,56,0.08)',
  accentSoft2: 'rgba(232,168,56,0.04)',
  accentDark: '#C48E2C',
  teal: '#34D399',
  tealLight: 'rgba(52,211,153,0.12)',
  orange: '#F59E0B',
  orangeLight: 'rgba(245,158,11,0.12)',
  indigo: '#818CF8',
  indigoLight: 'rgba(129,140,248,0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244,114,182,0.12)',
  mint: '#34D399',
  mintLight: 'rgba(52,211,153,0.12)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.12)',
  yellow: '#FBBF24',
  yellowLight: 'rgba(251,191,36,0.12)',
  rose: '#FB7185',
  roseLight: 'rgba(251,113,133,0.12)',
  sky: '#38BDF8',
  skyLight: 'rgba(56,189,248,0.12)',
  gold: '#E8A838',
  goldLight: 'rgba(232,168,56,0.12)',
  navy: '#09090B',
  navyLight: '#141417',
  text: '#F5F5F7',
  textPrimary: '#F5F5F7',
  textSecondary: '#8E8E93',
  textMuted: '#8E8E93',
  textTertiary: '#555560',
  textOnDark: '#F5F5F7',
  textOnDarkMuted: '#8E8E93',
  white: '#FFFFFF',
  black: '#09090B',
  separator: '#1E1E24',
  separatorLight: '#141417',
  opaqueSeparator: '#1E1E24',
  fill: '#1E1E24',
  secondaryFill: '#1E1E24',
  tertiaryFill: '#1A1A1F',
  overlay: 'rgba(0,0,0,0.75)',
  skeleton: '#141417',
  skeletonHighlight: '#1A1A1F',
  success: '#34D399',
  successLight: 'rgba(52,211,153,0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.12)',
  error: '#FB7185',
  errorLight: 'rgba(251,113,133,0.12)',
  destructive: '#FB7185',
  border: '#1E1E24',
  borderLight: '#141417',
  divider: '#1E1E24',
  glass: 'rgba(9,9,11,0.94)',
  glassLight: 'rgba(20,20,23,0.72)',
  gradientStart: '#E8A838',
  gradientEnd: '#F0C050',
  tabBarBg: '#101013',
  tabBarBorder: 'rgba(232,168,56,0.06)',
  cardShadow: '#000000',
  inputBg: '#141417',
  inputBorder: '#1E1E24',
  inputFocusBorder: '#E8A838',
  badgeBg: 'rgba(232,168,56,0.16)',
  shimmer: 'rgba(232,168,56,0.06)',
};

const lightColors: ThemeColors = {
  bg: '#F8F8FA',
  bgCard: '#FFFFFF',
  bgMuted: '#F0F0F3',
  bgSecondary: '#F3F3F6',
  bgGrouped: '#F8F8FA',
  bgElevated: '#FFFFFF',
  bgDark: '#E5E5EA',
  bgDarkCard: '#F0F0F3',
  bgDarkMuted: '#DCDCE0',
  accent: '#C48E2C',
  accentLight: 'rgba(196,142,44,0.10)',
  accentSoft: 'rgba(196,142,44,0.06)',
  accentSoft2: 'rgba(196,142,44,0.03)',
  accentDark: '#A87824',
  teal: '#059669',
  tealLight: 'rgba(5,150,105,0.10)',
  orange: '#D97706',
  orangeLight: 'rgba(217,119,6,0.10)',
  indigo: '#6366F1',
  indigoLight: 'rgba(99,102,241,0.10)',
  pink: '#EC4899',
  pinkLight: 'rgba(236,72,153,0.10)',
  mint: '#059669',
  mintLight: 'rgba(5,150,105,0.10)',
  cyan: '#0891B2',
  cyanLight: 'rgba(8,145,178,0.10)',
  yellow: '#D97706',
  yellowLight: 'rgba(217,119,6,0.10)',
  rose: '#E11D48',
  roseLight: 'rgba(225,29,72,0.10)',
  sky: '#0284C7',
  skyLight: 'rgba(2,132,199,0.10)',
  gold: '#B45309',
  goldLight: 'rgba(180,83,9,0.10)',
  navy: '#F8F8FA',
  navyLight: '#F0F0F3',
  text: '#1C1C1E',
  textPrimary: '#1C1C1E',
  textSecondary: '#636366',
  textMuted: '#636366',
  textTertiary: '#AEAEB2',
  textOnDark: '#F5F5F7',
  textOnDarkMuted: '#8E8E93',
  white: '#FFFFFF',
  black: '#1C1C1E',
  separator: '#E5E5EA',
  separatorLight: '#F0F0F3',
  opaqueSeparator: '#E5E5EA',
  fill: '#E5E5EA',
  secondaryFill: '#E5E5EA',
  tertiaryFill: '#F0F0F3',
  overlay: 'rgba(0,0,0,0.28)',
  skeleton: '#F0F0F3',
  skeletonHighlight: '#F3F3F6',
  success: '#059669',
  successLight: 'rgba(5,150,105,0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.10)',
  error: '#E11D48',
  errorLight: 'rgba(225,29,72,0.10)',
  destructive: '#E11D48',
  border: '#E5E5EA',
  borderLight: '#F0F0F3',
  divider: '#E5E5EA',
  glass: 'rgba(248,248,250,0.94)',
  glassLight: 'rgba(255,255,255,0.72)',
  gradientStart: '#C48E2C',
  gradientEnd: '#E8A838',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  cardShadow: 'rgba(0,0,0,0.06)',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5EA',
  inputFocusBorder: '#C48E2C',
  badgeBg: 'rgba(196,142,44,0.12)',
  shimmer: 'rgba(196,142,44,0.04)',
};

function getSystemTheme(): 'dark' | 'light' {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light' || stored === 'system') {
          console.log('[ThemeProvider] loaded stored mode', stored);
          setMode(stored);
        }
      } catch (err) {
        console.log('[ThemeProvider] failed to load mode', err);
      } finally {
        setLoaded(true);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      console.log('[ThemeProvider] system theme changed to', colorScheme);
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => subscription.remove();
  }, []);

  const resolvedMode = mode === 'system' ? systemTheme : mode;
  const isDark = resolvedMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : current === 'light' ? 'dark' : (systemTheme === 'dark' ? 'light' : 'dark');
      console.log('[ThemeProvider] toggling theme', { current, next });
      void AsyncStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, [systemTheme]);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    console.log('[ThemeProvider] setting theme mode to', newMode);
    setMode(newMode);
    void AsyncStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  return useMemo(
    () => ({
      mode,
      isDark,
      colors,
      loaded,
      toggleTheme,
      setThemeMode,
    }),
    [mode, isDark, colors, loaded, toggleTheme, setThemeMode],
  );
});
