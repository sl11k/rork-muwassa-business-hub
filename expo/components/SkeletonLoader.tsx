import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function FeedCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.feedCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={sk.row}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={sk.flex}>
          <Skeleton width={120} height={14} borderRadius={7} />
          <Skeleton width={80} height={11} borderRadius={6} />
        </View>
        <Skeleton width={28} height={11} borderRadius={6} />
      </View>
      <Skeleton height={14} borderRadius={7} />
      <Skeleton height={14} borderRadius={7} />
      <Skeleton width="60%" height={14} borderRadius={7} />
      <View style={sk.actions}>
        <Skeleton width={40} height={11} borderRadius={6} />
        <Skeleton width={40} height={11} borderRadius={6} />
        <Skeleton width={24} height={11} borderRadius={6} />
      </View>
    </View>
  );
}

export function CommunityCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={sk.row}>
        <Skeleton width={44} height={44} borderRadius={14} />
        <View style={sk.flex}>
          <Skeleton width={130} height={14} borderRadius={7} />
          <Skeleton width={180} height={11} borderRadius={6} />
        </View>
      </View>
      <View style={sk.actions}>
        <Skeleton width={60} height={20} borderRadius={10} />
        <Skeleton width={60} height={32} borderRadius={12} />
      </View>
    </View>
  );
}

export function ServiceCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={sk.row}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={sk.flex}>
          <Skeleton width={100} height={14} borderRadius={7} />
          <Skeleton width={60} height={20} borderRadius={10} />
        </View>
      </View>
      <Skeleton height={14} borderRadius={7} />
      <View style={sk.actions}>
        <Skeleton width={70} height={14} borderRadius={7} />
        <Skeleton width={60} height={32} borderRadius={12} />
      </View>
    </View>
  );
}

export function ConversationSkeleton() {
  return (
    <View style={sk.conversationRow}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={sk.flex}>
        <View style={sk.actions}>
          <Skeleton width={110} height={14} borderRadius={7} />
          <Skeleton width={30} height={11} borderRadius={6} />
        </View>
        <Skeleton height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function ResourceCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[sk.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      <View style={sk.row}>
        <Skeleton width={44} height={44} borderRadius={12} />
        <View style={sk.flex}>
          <Skeleton width={60} height={20} borderRadius={10} />
          <Skeleton width={160} height={14} borderRadius={7} />
        </View>
      </View>
      <Skeleton height={12} borderRadius={6} />
    </View>
  );
}

const sk = StyleSheet.create({
  feedCard: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flex: {
    flex: 1,
    gap: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
