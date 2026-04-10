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
  accentBlue: string;
  accentBlueLight: string;
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
  tabBarGlass: string;
  tabBarActiveGlass: string;
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
  info: string;
  infoLight: string;
}

const darkColors: ThemeColors = {
  bg: '#000000',
  bgCard: '#111827',
  bgMuted: '#161B22',
  bgSecondary: '#0B0F14',
  bgGrouped: '#000000',
  bgElevated: '#1F2937',
  accent: '#2DD4BF',
  accentLight: 'rgba(45,212,191,0.12)',
  accentSoft: 'rgba(45,212,191,0.08)',
  accentSoft2: 'rgba(45,212,191,0.04)',
  accentBlue: '#3B82F6',
  accentBlueLight: 'rgba(59,130,246,0.12)',
  text: '#F8FAFC',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textTertiary: '#64748B',
  white: '#FFFFFF',
  black: '#000000',
  separator: 'rgba(255,255,255,0.08)',
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',
  divider: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.72)',
  skeleton: '#111827',
  skeletonHighlight: '#1F2937',
  success: '#22C55E',
  successLight: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.12)',
  error: '#F87171',
  errorLight: 'rgba(248,113,113,0.12)',
  destructive: '#F87171',
  fill: '#1F2937',
  secondaryFill: '#161B22',
  tertiaryFill: '#111827',
  tabBarBg: 'rgba(10,10,10,0.55)',
  tabBarBorder: 'rgba(255,255,255,0.10)',
  tabBarGlass: 'rgba(15,23,42,0.45)',
  tabBarActiveGlass: 'rgba(45,212,191,0.15)',
  cardShadow: 'rgba(0,0,0,0.20)',
  inputBg: '#111827',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputFocusBorder: '#2DD4BF',
  teal: '#2DD4BF',
  tealLight: 'rgba(45,212,191,0.12)',
  orange: '#F59E0B',
  orangeLight: 'rgba(245,158,11,0.12)',
  indigo: '#818CF8',
  indigoLight: 'rgba(129,140,248,0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244,114,182,0.12)',
  cyan: '#5EEAD4',
  cyanLight: 'rgba(94,234,212,0.12)',
  yellow: '#F59E0B',
  yellowLight: 'rgba(245,158,11,0.12)',
  rose: '#F87171',
  roseLight: 'rgba(248,113,113,0.12)',
  sky: '#60A5FA',
  skyLight: 'rgba(96,165,250,0.12)',
  gold: '#D6B97A',
  goldLight: 'rgba(214,185,122,0.12)',
  navy: '#0F172A',
  navyLight: '#1E293B',
  mint: '#2DD4BF',
  mintLight: 'rgba(45,212,191,0.12)',
  glass: 'rgba(0,0,0,0.88)',
  glassLight: 'rgba(15,23,42,0.72)',
  separatorLight: '#111827',
  opaqueSeparator: 'rgba(255,255,255,0.08)',
  textOnDark: '#F8FAFC',
  textOnDarkMuted: '#94A3B8',
  gradientStart: '#2DD4BF',
  gradientEnd: '#0F8B8D',
  info: '#60A5FA',
  infoLight: 'rgba(96,165,250,0.12)',
};

const lightColors: ThemeColors = {
  bg: '#FFFFFF',
  bgCard: '#FCFCFD',
  bgMuted: '#F7F8FA',
  bgSecondary: '#F1F4F8',
  bgGrouped: '#FFFFFF',
  bgElevated: '#FFFFFF',
  accent: '#0F8B8D',
  accentLight: 'rgba(15,139,141,0.10)',
  accentSoft: 'rgba(15,139,141,0.06)',
  accentSoft2: 'rgba(15,139,141,0.03)',
  accentBlue: '#1D4ED8',
  accentBlueLight: 'rgba(29,78,216,0.10)',
  text: '#101828',
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#667085',
  textTertiary: '#98A2B3',
  white: '#FFFFFF',
  black: '#101828',
  separator: '#E7EAF0',
  border: '#E7EAF0',
  borderLight: '#F1F4F8',
  divider: '#E7EAF0',
  overlay: 'rgba(0,0,0,0.24)',
  skeleton: '#F1F4F8',
  skeletonHighlight: '#E7EAF0',
  success: '#12B76A',
  successLight: 'rgba(18,183,106,0.10)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.10)',
  error: '#EF4444',
  errorLight: 'rgba(239,68,68,0.10)',
  destructive: '#EF4444',
  fill: '#E7EAF0',
  secondaryFill: '#F1F4F8',
  tertiaryFill: '#F7F8FA',
  tabBarBg: 'rgba(255,255,255,0.70)',
  tabBarBorder: 'rgba(255,255,255,0.55)',
  tabBarGlass: 'rgba(255,255,255,0.70)',
  tabBarActiveGlass: 'rgba(15,139,141,0.12)',
  cardShadow: 'rgba(0,0,0,0.06)',
  inputBg: '#FCFCFD',
  inputBorder: '#E7EAF0',
  inputFocusBorder: '#0F8B8D',
  teal: '#0F8B8D',
  tealLight: 'rgba(15,139,141,0.10)',
  orange: '#F59E0B',
  orangeLight: 'rgba(245,158,11,0.10)',
  indigo: '#6366F1',
  indigoLight: 'rgba(99,102,241,0.10)',
  pink: '#EC4899',
  pinkLight: 'rgba(236,72,153,0.10)',
  cyan: '#14B8A6',
  cyanLight: 'rgba(20,184,166,0.10)',
  yellow: '#F59E0B',
  yellowLight: 'rgba(245,158,11,0.10)',
  rose: '#EF4444',
  roseLight: 'rgba(239,68,68,0.10)',
  sky: '#2563EB',
  skyLight: 'rgba(37,99,235,0.10)',
  gold: '#C8A96B',
  goldLight: 'rgba(200,169,107,0.10)',
  navy: '#0F172A',
  navyLight: '#F1F4F8',
  mint: '#0F8B8D',
  mintLight: 'rgba(15,139,141,0.10)',
  glass: 'rgba(255,255,255,0.92)',
  glassLight: 'rgba(255,255,255,0.78)',
  separatorLight: '#F1F4F8',
  opaqueSeparator: '#E7EAF0',
  textOnDark: '#FAFAFA',
  textOnDarkMuted: '#667085',
  gradientStart: '#0F8B8D',
  gradientEnd: '#14B8A6',
  info: '#2563EB',
  infoLight: 'rgba(37,99,235,0.10)',
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
