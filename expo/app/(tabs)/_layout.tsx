import { Tabs } from 'expo-router';
import React, { useRef, useEffect, useCallback } from 'react';
import {
  Platform,
  View,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/ThemeProvider';

const TAB_ICONS = {
  home: 'https://r2-pub.rork.com/generated-images/6eed80cc-7aca-48e8-bd7f-dd6c5d44dc13.png',
  discover: 'https://r2-pub.rork.com/generated-images/95fa5eed-f2a1-45a3-b14b-01dd3c05973b.png',
  messages: 'https://r2-pub.rork.com/generated-images/21f5c451-5542-4b76-856b-1be207911847.png',
  marketplace: 'https://r2-pub.rork.com/generated-images/30e567a6-0cda-4e66-b4a2-ed9e3cd87710.png',
  profile: 'https://r2-pub.rork.com/generated-images/b9eab633-4c74-496a-be8d-70fc2c56511b.png',
};

const TAB_COUNT = 5;
const BAR_H_PADDING = 24;
const BAR_INNER_PADDING = 6;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH - BAR_H_PADDING * 2;
const ITEM_AREA_WIDTH = BAR_WIDTH - BAR_INNER_PADDING * 2;
const ITEM_WIDTH = ITEM_AREA_WIDTH / TAB_COUNT;
const INDICATOR_WIDTH = ITEM_WIDTH - 4;
const BAR_HEIGHT = 64;
const BAR_RADIUS = BAR_HEIGHT / 2;

function LiquidGlassTabBar({
  state,
  descriptors,
  navigation,
}: {
  state: any;
  descriptors: any;
  navigation: any;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    const targetX =
      BAR_INNER_PADDING + state.index * ITEM_WIDTH + (ITEM_WIDTH - INDICATOR_WIDTH) / 2;
    Animated.spring(indicatorX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [state.index]);

  const handlePress = useCallback(
    (route: any, index: number) => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }

      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: 0.82,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
      ]).start();
    },
    [navigation, scaleAnims]
  );

  const tabIcons = [
    TAB_ICONS.home,
    TAB_ICONS.discover,
    TAB_ICONS.messages,
    TAB_ICONS.marketplace,
    TAB_ICONS.profile,
  ];

  const bottomOffset = Platform.OS === 'web' ? 14 : Math.max(insets.bottom, 12) + 4;

  return (
    <View
      style={[
        styles.barOuter,
        {
          bottom: bottomOffset,
          left: BAR_H_PADDING,
          right: BAR_H_PADDING,
        },
      ]}
    >
      <View style={[styles.barContainer, { borderRadius: BAR_RADIUS }]}>
        {Platform.OS === 'web' ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(8,8,10,0.82)'
                  : 'rgba(255,255,255,0.78)',
                borderRadius: BAR_RADIUS,
              },
            ]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: BAR_RADIUS, overflow: 'hidden' as const },
            ]}
          >
            <BlurView
              intensity={isDark ? 55 : 70}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(8,8,10,0.55)'
                    : 'rgba(255,255,255,0.45)',
                },
              ]}
            />
          </View>
        )}

        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: BAR_RADIUS,
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.06)',
            },
          ]}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.indicator,
            {
              width: INDICATOR_WIDTH,
              height: BAR_HEIGHT - BAR_INNER_PADDING * 2 - 4,
              borderRadius: (BAR_HEIGHT - BAR_INNER_PADDING * 2 - 4) / 2,
              backgroundColor: isDark
                ? 'rgba(45,212,191,0.14)'
                : 'rgba(15,139,141,0.10)',
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(45,212,191,0.20)'
                : 'rgba(15,139,141,0.15)',
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const iconUri = tabIcons[index];

            return (
              <Pressable
                key={route.key}
                onPress={() => handlePress(route, index)}
                style={styles.tabItem}
                testID={`tab-${route.name}`}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnims[index] }],
                    alignItems: 'center' as const,
                    justifyContent: 'center' as const,
                  }}
                >
                  <Image
                    source={{ uri: iconUri }}
                    style={[
                      styles.icon,
                      {
                        opacity: isFocused ? 1 : 0.45,
                      },
                    ]}
                    resizeMode="contain"
                  />
                  {index === 2 && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.error },
                      ]}
                    />
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: '' }} />
      <Tabs.Screen name="communities" options={{ title: '' }} />
      <Tabs.Screen name="messages" options={{ title: '' }} />
      <Tabs.Screen name="marketplace" options={{ title: '' }} />
      <Tabs.Screen name="more" options={{ title: '' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    zIndex: 100,
  },
  barContainer: {
    height: BAR_HEIGHT,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
      } as any,
    }),
  },
  indicator: {
    position: 'absolute',
    top: BAR_INNER_PADDING + 2,
    left: 0,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: BAR_INNER_PADDING,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  icon: {
    width: 34,
    height: 34,
  },
  unreadDot: {
    position: 'absolute',
    top: -1,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.3)',
  },
});
