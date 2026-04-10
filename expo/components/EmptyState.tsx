import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor,
  compact = false,
}: EmptyStateProps) {
  const { colors } = useTheme();
  const resolvedIconColor = iconColor ?? colors.accent;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.container, compact && styles.containerCompact, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.iconWrap, { backgroundColor: resolvedIconColor + '14' }]}>
        <Icon color={resolvedIconColor} size={compact ? 24 : 40} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, { color: colors.text }, compact && styles.titleCompact]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }, compact && styles.descCompact]}>{description}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [
            styles.actionBtn,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  containerCompact: {
    paddingVertical: 36,
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  titleCompact: {
    fontSize: 15,
  },
  description: {
    fontSize: 13,
    textAlign: 'center' as const,
    lineHeight: 19,
  },
  descCompact: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionBtn: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
