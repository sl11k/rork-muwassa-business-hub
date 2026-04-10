import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, X, CircleAlert, Info } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ visible, message, type = 'success', onDismiss, duration = 2500 }: ToastProps) {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const getConfig = (t: ToastType) => {
    switch (t) {
      case 'success':
        return { icon: Check, stripeColor: colors.success, iconColor: colors.success };
      case 'error':
        return { icon: CircleAlert, stripeColor: colors.error, iconColor: colors.error };
      case 'info':
        return { icon: Info, stripeColor: colors.cyan, iconColor: colors.cyan };
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 260 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismissRef.current());
      }, duration);
      return () => clearTimeout(timer);
    } else {
      translateY.setValue(-100);
      opacity.setValue(0);
    }
  }, [visible, duration, translateY, opacity]);

  if (!visible) return null;

  const config = getConfig(type);
  const Icon = config.icon;

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismissRef.current());
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
        transform: [{ translateY }],
        opacity,
      },
    ]}>
      <View style={[styles.stripe, { backgroundColor: config.stripeColor }]} />
      <Icon color={config.iconColor} size={18} strokeWidth={2} />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>{message}</Text>
      <Pressable onPress={dismiss} style={styles.closeBtn} hitSlop={8}>
        <X color={colors.textMuted} size={14} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 0,
    paddingRight: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 9999,
    overflow: 'hidden',
  },
  stripe: {
    width: 3,
    alignSelf: 'stretch',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginRight: 10,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  closeBtn: {
    padding: 4,
  },
});
