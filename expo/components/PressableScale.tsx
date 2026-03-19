import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

interface PressableScaleProps extends PressableProps {
  scale?: number;
  haptic?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
}

export function PressableScale({
  scale = 0.97,
  haptic = false,
  style,
  children,
  onPress,
  ...rest
}: PressableScaleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: scale,
        useNativeDriver: true,
        damping: 18,
        stiffness: 280,
        mass: 0.8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.92,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, scale]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 200,
        mass: 0.6,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const handlePress = useCallback(
    (e: any) => {
      if (haptic) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress?.(e);
    },
    [haptic, onPress],
  );

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={handlePress} {...rest}>
      <Animated.View style={[style as ViewStyle, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
