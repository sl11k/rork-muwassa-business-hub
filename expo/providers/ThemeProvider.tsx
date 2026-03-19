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
  bg: '#0A0E1A',
  bgCard: '#111827',
  bgMuted: '#1A2035',
  bgSecondary: '#0D1220',
  bgGrouped: '#0A0E1A',
  bgElevated: '#1E2A40',
  bgDark: '#060914',
  bgDarkCard: '#0D1220',
  bgDarkMuted: '#151C2E',
  accent: '#00C9A7',
  accentLight: 'rgba(0,201,167,0.14)',
  accentSoft: 'rgba(0,201,167,0.08)',
  accentSoft2: 'rgba(0,201,167,0.04)',
  accentDark: '#00A88F',
  teal: '#00C9A7',
  tealLight: 'rgba(0,201,167,0.12)',
  orange: '#FFB547',
  orangeLight: 'rgba(255,181,71,0.12)',
  indigo: '#818CF8',
  indigoLight: 'rgba(129,140,248,0.12)',
  pink: '#F472B6',
  pinkLight: 'rgba(244,114,182,0.12)',
  mint: '#34D399',
  mintLight: 'rgba(52,211,153,0.12)',
  cyan: '#22D3EE',
  cyanLight: 'rgba(34,211,238,0.12)',
  yellow: '#FFB547',
  yellowLight: 'rgba(255,181,71,0.12)',
  rose: '#FB7185',
  roseLight: 'rgba(251,113,133,0.12)',
  sky: '#38BDF8',
  skyLight: 'rgba(56,189,248,0.12)',
  gold: '#FFB547',
  goldLight: 'rgba(255,181,71,0.12)',
  navy: '#0A0E1A',
  navyLight: '#111827',
  text: '#F0F2F5',
  textPrimary: '#F0F2F5',
  textSecondary: '#8B95A8',
  textMuted: '#8B95A8',
  textTertiary: '#5A6478',
  textOnDark: '#F0F2F5',
  textOnDarkMuted: '#8B95A8',
  white: '#FFFFFF',
  black: '#0A0E1A',
  separator: '#1A2035',
  separatorLight: '#111827',
  opaqueSeparator: '#1A2035',
  fill: '#1E2A40',
  secondaryFill: '#1E2A40',
  tertiaryFill: '#1A2035',
  overlay: 'rgba(0,0,0,0.72)',
  skeleton: '#111827',
  skeletonHighlight: '#1A2035',
  success: '#00C9A7',
  successLight: 'rgba(0,201,167,0.12)',
  warning: '#FFB547',
  warningLight: 'rgba(255,181,71,0.12)',
  error: '#FB7185',
  errorLight: 'rgba(251,113,133,0.12)',
  destructive: '#FB7185',
  border: '#1A2035',
  borderLight: '#111827',
  divider: '#1A2035',
  glass: 'rgba(10,14,26,0.94)',
  glassLight: 'rgba(17,24,39,0.72)',
  gradientStart: '#00C9A7',
  gradientEnd: '#00E5C3',
  tabBarBg: '#0D1220',
  tabBarBorder: 'rgba(0,201,167,0.06)',
  cardShadow: '#000000',
  inputBg: '#111827',
  inputBorder: '#1A2035',
  inputFocusBorder: '#00C9A7',
  badgeBg: 'rgba(0,201,167,0.16)',
  shimmer: 'rgba(0,201,167,0.06)',
};

const lightColors: ThemeColors = {
  bg: '#F5F6F8',
  bgCard: '#FFFFFF',
  bgMuted: '#EDF0F4',
  bgSecondary: '#F0F2F5',
  bgGrouped: '#F5F6F8',
  bgElevated: '#FFFFFF',
  bgDark: '#E2E5EB',
  bgDarkCard: '#EDF0F4',
  bgDarkMuted: '#D8DCE3',
  accent: '#00A88F',
  accentLight: 'rgba(0,168,143,0.10)',
  accentSoft: 'rgba(0,168,143,0.06)',
  accentSoft2: 'rgba(0,168,143,0.03)',
  accentDark: '#008F79',
  teal: '#00A88F',
  tealLight: 'rgba(0,168,143,0.10)',
  orange: '#E09A20',
  orangeLight: 'rgba(224,154,32,0.10)',
  indigo: '#6366F1',
  indigoLight: 'rgba(99,102,241,0.10)',
  pink: '#EC4899',
  pinkLight: 'rgba(236,72,153,0.10)',
  mint: '#059669',
  mintLight: 'rgba(5,150,105,0.10)',
  cyan: '#0891B2',
  cyanLight: 'rgba(8,145,178,0.10)',
  yellow: '#D4890E',
  yellowLight: 'rgba(212,137,14,0.10)',
  rose: '#E11D48',
  roseLight: 'rgba(225,29,72,0.10)',
  sky: '#0284C7',
  skyLight: 'rgba(2,132,199,0.10)',
  gold: '#B45309',
  goldLight: 'rgba(180,83,9,0.10)',
  navy: '#F5F6F8',
  navyLight: '#EDF0F4',
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#5A6478',
  textMuted: '#5A6478',
  textTertiary: '#94A3B8',
  textOnDark: '#F5F6F8',
  textOnDarkMuted: '#8B95A8',
  white: '#FFFFFF',
  black: '#111827',
  separator: '#E2E5EB',
  separatorLight: '#EDF0F4',
  opaqueSeparator: '#E2E5EB',
  fill: '#E2E5EB',
  secondaryFill: '#E2E5EB',
  tertiaryFill: '#EDF0F4',
  overlay: 'rgba(0,0,0,0.28)',
  skeleton: '#EDF0F4',
  skeletonHighlight: '#F0F2F5',
  success: '#00A88F',
  successLight: 'rgba(0,168,143,0.10)',
  warning: '#D4890E',
  warningLight: 'rgba(212,137,14,0.10)',
  error: '#E11D48',
  errorLight: 'rgba(225,29,72,0.10)',
  destructive: '#E11D48',
  border: '#E2E5EB',
  borderLight: '#EDF0F4',
  divider: '#E2E5EB',
  glass: 'rgba(245,246,248,0.94)',
  glassLight: 'rgba(255,255,255,0.72)',
  gradientStart: '#00A88F',
  gradientEnd: '#00C9A7',
  tabBarBg: '#FFFFFF',
  tabBarBorder: 'rgba(0,0,0,0.06)',
  cardShadow: 'rgba(0,0,0,0.06)',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E5EB',
  inputFocusBorder: '#00A88F',
  badgeBg: 'rgba(0,168,143,0.12)',
  shimmer: 'rgba(0,168,143,0.04)',
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
