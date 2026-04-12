import { Tabs } from 'expo-router';
import React, { useRef, useEffect, useCallback } from 'react';
import {
  Platform,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Search,
  MessageSquare,
  ShoppingBag,
  User,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';

const TAB_COUNT = 5;
const BAR_H_PADDING = 20;
const BAR_INNER_PADDING = 8;
const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH - BAR_H_PADDING * 2;
const ITEM_AREA_WIDTH = BAR_WIDTH - BAR_INNER_PADDING * 2;
const ITEM_WIDTH = ITEM_AREA_WIDTH / TAB_COUNT;
const INDICATOR_SIZE = 44;
const BAR_HEIGHT = 62;
const BAR_RADIUS = BAR_HEIGHT / 2;

const TAB_ICON_COMPONENTS = [Home, Search, MessageSquare, ShoppingBag, User];
const ICON_SIZE = 22;
const ICON_STROKE = 1.8;

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
      BAR_INNER_PADDING + state.index * ITEM_WIDTH + (ITEM_WIDTH - INDICATOR_SIZE) / 2;
    Animated.spring(indicatorX, {
      toValue: targetX,
      useNativeDriver: true,
      tension: 80,
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
          toValue: 0.78,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnims[index], {
          toValue: 1,
          useNativeDriver: true,
          tension: 320,
          friction: 14,
        }),
      ]).start();
    },
    [navigation, scaleAnims]
  );

  const bottomOffset = Platform.OS === 'web' ? 16 : Math.max(insets.bottom, 14) + 2;

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
                  ? 'rgba(6,6,8,0.85)'
                  : 'rgba(255,255,255,0.82)',
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
              intensity={isDark ? 60 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(6,6,8,0.52)'
                    : 'rgba(255,255,255,0.48)',
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
              borderWidth: 0.5,
              borderColor: isDark
                ? 'rgba(255,255,255,0.10)'
                : 'rgba(0,0,0,0.05)',
            },
          ]}
          pointerEvents="none"
        />

        <Animated.View
          style={[
            styles.indicator,
            {
              width: INDICATOR_SIZE,
              height: INDICATOR_SIZE,
              borderRadius: INDICATOR_SIZE / 2,
              backgroundColor: isDark
                ? 'rgba(45,212,191,0.16)'
                : 'rgba(15,139,141,0.11)',
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />

        <View style={styles.tabRow}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const IconComponent = TAB_ICON_COMPONENTS[index];

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
                  <IconComponent
                    color={isFocused
                      ? (isDark ? colors.iconActive : colors.iconActive)
                      : (isDark ? colors.iconInactive : colors.iconInactive)
                    }
                    size={ICON_SIZE}
                    strokeWidth={isFocused ? 2.2 : ICON_STROKE}
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
        shadowOpacity: 0.14,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
      },
      android: {
        elevation: 14,
      },
      web: {
        boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      } as any,
    }),
  },
  indicator: {
    position: 'absolute',
    top: (BAR_HEIGHT - INDICATOR_SIZE) / 2,
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
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.2)',
  },
});
