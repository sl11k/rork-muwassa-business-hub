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
  accent: string;
  accentLight: string;
  accentSoft: string;
  accentSoft2: string;
  text: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textTertiary: string;
  white: string;
  black: string;
  separator: string;
  border: string;
  borderLight: string;
  divider: string;
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
  fill: string;
  secondaryFill: string;
  tertiaryFill: string;
  tabBarBg: string;
  tabBarBorder: string;
  cardShadow: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  teal: string;
  tealLight: string;
  orange: string;
  orangeLight: string;
  indigo: string;
  indigoLight: string;
  pink: string;
  pinkLight: string;
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
  mint: string;
  mintLight: string;
  glass: string;
  glassLight: string;
  separatorLight: string;
  opaqueSeparator: string;
  textOnDark: string;
  textOnDarkMuted: string;
  gradientStart: string;
  gradientEnd: string;
}

const darkColors: ThemeColors = {
  bg: '#0C0C0E',
  bgCard: '#18181B',
  bgMuted: '#27272A',
  bgSecondary: '#111113',
  bgGrouped: '#0C0C0E',
  bgElevated: '#1F1F23',
  accent: '#2DD4BF',
  accentLight: 'rgba(45,212,191,0.14)',
  accentSoft: 'rgba(45,212,191,0.08)',
  accentSoft2: 'rgba(45,212,191,0.04)',
  text: '#E4E4E7',
  textPrimary: '#E4E4E7',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textTertiary: '#52525B',
  white: '#FFFFFF',
  black: '#0C0C0E',
  separator: '#27272A',
  border: '#27272A',
  borderLight: '#1F1F23',
  divider: '#27272A',
  overlay: 'rgba(0,0,0,0.72)',
  skeleton: '#18181B',
  skeletonHighlight: '#27272A',
  success: '#2DD4BF',
  successLight: 'rgba(45,212,191,0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.12)',
  error: '#FB7185',
  errorLight: 'rgba(251,113,133,0.12)',
  destructive: '#FB7185',
  fill: '#27272A',
  secondaryFill: '#1F1F23',
  tertiaryFill: '#18181B',
  tabBarBg: '#0C0C0E',
  tabBarBorder: 'rgba(255,255,255,0.06)',
  cardShadow: 'rgba(0,0,0,0.04)',
  inputBg: '#18181B',
  inputBorder: '#27272A',
  inputFocusBorder: '#2DD4BF',
  teal: '#2DD4BF',
  tealLight: 'rgba(45,212,191,0.12)',
  orange: '#FBBF24',
  orangeLight: 'rgba(251,191,36,0.12)',
  indigo: '#818CF8',
  indigoLight: 'rgba(129,140,248,0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244,114,182,0.12)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.12)',
  yellow: '#FBBF24',
  yellowLight: 'rgba(251,191,36,0.12)',
  rose: '#FB7185',
  roseLight: 'rgba(251,113,133,0.12)',
  sky: '#38BDF8',
  skyLight: 'rgba(56,189,248,0.12)',
  gold: '#FBBF24',
  goldLight: 'rgba(251,191,36,0.12)',
  navy: '#0C0C0E',
  navyLight: '#18181B',
  mint: '#2DD4BF',
  mintLight: 'rgba(45,212,191,0.12)',
  glass: 'rgba(0,0,0,0.92)',
  glassLight: 'rgba(17,17,19,0.78)',
  separatorLight: '#18181B',
  opaqueSeparator: '#27272A',
  textOnDark: '#E4E4E7',
  textOnDarkMuted: '#71717A',
  gradientStart: '#2DD4BF',
  gradientEnd: '#0D9488',
};

const lightColors: ThemeColors = {
  bg: '#FAFAF9',
  bgCard: '#FFFFFF',
  bgMuted: '#F5F5F4',
  bgSecondary: '#F5F5F4',
  bgGrouped: '#FAFAF9',
  bgElevated: '#FFFFFF',
  accent: '#0D9488',
  accentLight: 'rgba(13,148,136,0.10)',
  accentSoft: 'rgba(13,148,136,0.06)',
  accentSoft2: 'rgba(13,148,136,0.03)',
  text: '#18181B',
  textPrimary: '#18181B',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',
  textTertiary: '#A1A1AA',
  white: '#FFFFFF',
  black: '#18181B',
  separator: '#E7E5E4',
  border: '#E7E5E4',
  borderLight: '#F5F5F4',
  divider: '#E7E5E4',
  overlay: 'rgba(0,0,0,0.24)',
  skeleton: '#F5F5F4',
  skeletonHighlight: '#EEEEEC',
  success: '#0D9488',
  successLight: 'rgba(13,148,136,0.10)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.10)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.10)',
  destructive: '#EF4444',
  fill: '#E7E5E4',
  secondaryFill: '#F5F5F4',
  tertiaryFill: '#FAFAF9',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  cardShadow: 'rgba(0,0,0,0.04)',
  inputBg: '#FFFFFF',
  inputBorder: '#E7E5E4',
  inputFocusBorder: '#0D9488',
  teal: '#0D9488',
  tealLight: 'rgba(13,148,136,0.10)',
  orange: '#D97706',
  orangeLight: 'rgba(217,119,6,0.10)',
  indigo: '#6366F1',
  indigoLight: 'rgba(99,102,241,0.10)',
  pink: '#EC4899',
  pinkLight: 'rgba(236,72,153,0.10)',
  cyan: '#0891B2',
  cyanLight: 'rgba(8,145,178,0.10)',
  yellow: '#D97706',
  yellowLight: 'rgba(217,119,6,0.10)',
  rose: '#EF4444',
  roseLight: 'rgba(239,68,68,0.10)',
  sky: '#0284C7',
  skyLight: 'rgba(2,132,199,0.10)',
  gold: '#D97706',
  goldLight: 'rgba(217,119,6,0.10)',
  navy: '#FAFAF9',
  navyLight: '#F5F5F4',
  mint: '#0D9488',
  mintLight: 'rgba(13,148,136,0.10)',
  glass: 'rgba(250,250,249,0.92)',
  glassLight: 'rgba(255,255,255,0.78)',
  separatorLight: '#F5F5F4',
  opaqueSeparator: '#E7E5E4',
  textOnDark: '#FAFAFA',
  textOnDarkMuted: '#71717A',
  gradientStart: '#0D9488',
  gradientEnd: '#0F766E',
};

function getSystemTheme(): 'dark' | 'light' {
  try {
    const colorScheme = Appearance.getColorScheme();
    return colorScheme === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
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
