import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet, Image } from 'react-native';
import { BlurView } from 'expo-blur';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

const TAB_ICONS = {
  home: 'https://r2-pub.rork.com/generated-images/81076518-927d-41bf-ae3a-a034f6f78bda.png',
  discover: 'https://r2-pub.rork.com/generated-images/d78832ae-1e72-4258-8895-9a93f8f2728d.png',
  messages: 'https://r2-pub.rork.com/generated-images/58fa5ea7-5cdc-47ed-a86a-2781384f3595.png',
  marketplace: 'https://r2-pub.rork.com/generated-images/e1001a4e-4d6f-4ebe-bd89-373faa7aa8e1.png',
  profile: 'https://r2-pub.rork.com/generated-images/abc72434-7937-4e81-bd1a-203649b6d715.png',
};

export default function TabLayout() {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.iconInactive,
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: Platform.OS === 'web' ? 12 : 24,
          left: 20,
          right: 20,
          borderRadius: 32,
          height: 68,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: isDark ? '#000000' : '#0F172A',
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.tabBarBorder,
          overflow: 'hidden' as const,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 6,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
        },
        tabBarBackground: () => (
          Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
              borderRadius: 32,
              overflow: 'hidden',
            }]}>
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
              }]} />
            </View>
          ) : (
            <View style={[StyleSheet.absoluteFill, { borderRadius: 32, overflow: 'hidden' }]}>
              <BlurView
                intensity={isDark ? 40 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: isDark ? colors.tabBarBg : colors.tabBarGlass,
              }]} />
            </View>
          )
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Image
              source={{ uri: TAB_ICONS.home }}
              style={[s.tabIcon, focused ? s.tabIconActive : s.tabIconInactive]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Image
              source={{ uri: TAB_ICONS.discover }}
              style={[s.tabIcon, focused ? s.tabIconActive : s.tabIconInactive]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={s.iconWrap}>
              <Image
                source={{ uri: TAB_ICONS.messages }}
                style={[s.tabIcon, focused ? s.tabIconActive : s.tabIconInactive]}
                resizeMode="contain"
              />
              <View style={[s.unreadDot, { backgroundColor: colors.error }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Image
              source={{ uri: TAB_ICONS.marketplace }}
              style={[s.tabIcon, focused ? s.tabIconActive : s.tabIconInactive]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <Image
              source={{ uri: TAB_ICONS.profile }}
              style={[s.tabIcon, focused ? s.tabIconActive : s.tabIconInactive]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabIcon: {
    width: 36,
    height: 36,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabIconInactive: {
    opacity: 0.5,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
