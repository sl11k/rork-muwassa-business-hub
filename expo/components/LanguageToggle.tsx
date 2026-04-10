import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Globe } from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={toggleLanguage}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: isDark ? colors.bgCard : colors.bgMuted,
          borderColor: isDark ? colors.border : colors.separator,
        },
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
      ]}
      testID="language-toggle"
    >
      <Globe color={colors.textSecondary} size={13} strokeWidth={1.8} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{language === 'ar' ? 'EN' : 'عربي'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
});
