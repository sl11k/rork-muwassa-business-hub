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
  gradientAccent1: string;
  gradientAccent2: string;
  tabBarBg: string;
  tabBarBorder: string;
  cardShadow: string;
  inputBg: string;
  inputBorder: string;
  inputFocusBorder: string;
  badgeBg: string;
  shimmer: string;
  heroGradientStart: string;
  heroGradientMid: string;
  heroGradientEnd: string;
  storyRing1: string;
  storyRing2: string;
}

const darkColors: ThemeColors = {
  bg: '#000000',
  bgCard: '#111113',
  bgMuted: '#19191C',
  bgSecondary: '#0C0C0E',
  bgGrouped: '#000000',
  bgElevated: '#1F1F23',
  bgDark: '#000000',
  bgDarkCard: '#0C0C0E',
  bgDarkMuted: '#111113',
  accent: '#D4A254',
  accentLight: 'rgba(212,162,84,0.14)',
  accentSoft: 'rgba(212,162,84,0.08)',
  accentSoft2: 'rgba(212,162,84,0.04)',
  accentDark: '#B8892E',
  teal: '#2DD4A8',
  tealLight: 'rgba(45,212,168,0.12)',
  orange: '#F59E0B',
  orangeLight: 'rgba(245,158,11,0.12)',
  indigo: '#8B8DF8',
  indigoLight: 'rgba(139,141,248,0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244,114,182,0.12)',
  mint: '#2DD4A8',
  mintLight: 'rgba(45,212,168,0.12)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.12)',
  yellow: '#FBBF24',
  yellowLight: 'rgba(251,191,36,0.12)',
  rose: '#FB7185',
  roseLight: 'rgba(251,113,133,0.12)',
  sky: '#38BDF8',
  skyLight: 'rgba(56,189,248,0.12)',
  gold: '#D4A254',
  goldLight: 'rgba(212,162,84,0.12)',
  navy: '#000000',
  navyLight: '#111113',
  text: '#FAFAFA',
  textPrimary: '#FAFAFA',
  textSecondary: '#8A8A8E',
  textMuted: '#8A8A8E',
  textTertiary: '#4E4E52',
  textOnDark: '#FAFAFA',
  textOnDarkMuted: '#8A8A8E',
  white: '#FFFFFF',
  black: '#000000',
  separator: '#1F1F23',
  separatorLight: '#111113',
  opaqueSeparator: '#1F1F23',
  fill: '#1F1F23',
  secondaryFill: '#1F1F23',
  tertiaryFill: '#19191C',
  overlay: 'rgba(0,0,0,0.78)',
  skeleton: '#111113',
  skeletonHighlight: '#19191C',
  success: '#2DD4A8',
  successLight: 'rgba(45,212,168,0.12)',
  warning: '#FBBF24',
  warningLight: 'rgba(251,191,36,0.12)',
  error: '#FB7185',
  errorLight: 'rgba(251,113,133,0.12)',
  destructive: '#FB7185',
  border: '#1F1F23',
  borderLight: '#111113',
  divider: '#1F1F23',
  glass: 'rgba(0,0,0,0.92)',
  glassLight: 'rgba(17,17,19,0.78)',
  gradientStart: '#D4A254',
  gradientEnd: '#E8BD6E',
  gradientAccent1: '#D4A254',
  gradientAccent2: '#C47A2A',
  tabBarBg: 'rgba(0,0,0,0.85)',
  tabBarBorder: 'rgba(255,255,255,0.04)',
  cardShadow: '#000000',
  inputBg: '#111113',
  inputBorder: '#1F1F23',
  inputFocusBorder: '#D4A254',
  badgeBg: 'rgba(212,162,84,0.16)',
  shimmer: 'rgba(212,162,84,0.06)',
  heroGradientStart: '#1A1408',
  heroGradientMid: '#0D0A04',
  heroGradientEnd: '#000000',
  storyRing1: '#D4A254',
  storyRing2: '#E8BD6E',
};

const lightColors: ThemeColors = {
  bg: '#FAFAF9',
  bgCard: '#FFFFFF',
  bgMuted: '#F3F2EF',
  bgSecondary: '#F6F5F3',
  bgGrouped: '#FAFAF9',
  bgElevated: '#FFFFFF',
  bgDark: '#EAEAE7',
  bgDarkCard: '#F3F2EF',
  bgDarkMuted: '#E0DFDC',
  accent: '#9B7730',
  accentLight: 'rgba(155,119,48,0.10)',
  accentSoft: 'rgba(155,119,48,0.06)',
  accentSoft2: 'rgba(155,119,48,0.03)',
  accentDark: '#7D5F24',
  teal: '#0D9373',
  tealLight: 'rgba(13,147,115,0.10)',
  orange: '#C27803',
  orangeLight: 'rgba(194,120,3,0.10)',
  indigo: '#5B5CF6',
  indigoLight: 'rgba(91,92,246,0.10)',
  pink: '#D94891',
  pinkLight: 'rgba(217,72,145,0.10)',
  mint: '#0D9373',
  mintLight: 'rgba(13,147,115,0.10)',
  cyan: '#0788A3',
  cyanLight: 'rgba(7,136,163,0.10)',
  yellow: '#C27803',
  yellowLight: 'rgba(194,120,3,0.10)',
  rose: '#D6294A',
  roseLight: 'rgba(214,41,74,0.10)',
  sky: '#0272AD',
  skyLight: 'rgba(2,114,173,0.10)',
  gold: '#9B7730',
  goldLight: 'rgba(155,119,48,0.10)',
  navy: '#FAFAF9',
  navyLight: '#F3F2EF',
  text: '#1A1A1A',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textMuted: '#6B6B6B',
  textTertiary: '#A3A3A3',
  textOnDark: '#FAFAFA',
  textOnDarkMuted: '#8A8A8E',
  white: '#FFFFFF',
  black: '#1A1A1A',
  separator: '#EAEAE7',
  separatorLight: '#F3F2EF',
  opaqueSeparator: '#EAEAE7',
  fill: '#EAEAE7',
  secondaryFill: '#EAEAE7',
  tertiaryFill: '#F3F2EF',
  overlay: 'rgba(0,0,0,0.24)',
  skeleton: '#F3F2EF',
  skeletonHighlight: '#F6F5F3',
  success: '#0D9373',
  successLight: 'rgba(13,147,115,0.10)',
  warning: '#C27803',
  warningLight: 'rgba(194,120,3,0.10)',
  error: '#D6294A',
  errorLight: 'rgba(214,41,74,0.10)',
  destructive: '#D6294A',
  border: '#EAEAE7',
  borderLight: '#F3F2EF',
  divider: '#EAEAE7',
  glass: 'rgba(250,250,249,0.92)',
  glassLight: 'rgba(255,255,255,0.78)',
  gradientStart: '#9B7730',
  gradientEnd: '#B8943E',
  gradientAccent1: '#9B7730',
  gradientAccent2: '#7D5F24',
  tabBarBg: 'rgba(255,255,255,0.88)',
  tabBarBorder: 'rgba(0,0,0,0.04)',
  cardShadow: 'rgba(0,0,0,0.04)',
  inputBg: '#FFFFFF',
  inputBorder: '#EAEAE7',
  inputFocusBorder: '#9B7730',
  badgeBg: 'rgba(155,119,48,0.12)',
  shimmer: 'rgba(155,119,48,0.04)',
  heroGradientStart: '#F5F0E6',
  heroGradientMid: '#FAF8F4',
  heroGradientEnd: '#FAFAF9',
  storyRing1: '#9B7730',
  storyRing2: '#B8943E',
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
