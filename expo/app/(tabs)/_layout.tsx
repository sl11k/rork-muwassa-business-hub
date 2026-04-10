import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  LayoutGrid,
  Compass,
  MessageSquareText,
  ShoppingBag,
  UserCircle2,
} from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { language } = useLanguage();
  const { colors, isDark } = useTheme();

  const tabLabels = {
    home: language === 'ar' ? 'الرئيسية' : 'Home',
    communities: language === 'ar' ? 'اكتشف' : 'Discover',
    messages: language === 'ar' ? 'الرسائل' : 'Messages',
    marketplace: language === 'ar' ? 'السوق' : 'Market',
    more: language === 'ar' ? 'حسابي' : 'Profile',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? '#64748B' : '#98A2B3',
        tabBarStyle: {
          position: 'absolute' as const,
          bottom: Platform.OS === 'web' ? 12 : 24,
          left: 20,
          right: 20,
          borderRadius: 32,
          height: 68,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: isDark ? '#000' : '#0F172A',
          shadowOpacity: isDark ? 0.4 : 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
          overflow: 'hidden' as const,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500' as const,
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 8 : 10,
          letterSpacing: 0.1,
        },
        tabBarItemStyle: {
          paddingTop: 10,
        },
        tabBarBackground: () => (
          Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, {
              backgroundColor: isDark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)',
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
                backgroundColor: isDark ? 'rgba(10,10,10,0.55)' : 'rgba(255,255,255,0.55)',
              }]} />
            </View>
          )
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabLabels.home,
          tabBarIcon: ({ color, focused }) => (
            <LayoutGrid
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.5}
              fill={focused ? color : 'transparent'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: tabLabels.communities,
          tabBarIcon: ({ color, focused }) => (
            <Compass
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: tabLabels.messages,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              <MessageSquareText
                color={color}
                size={21}
                strokeWidth={focused ? 2.2 : 1.5}
                fill={focused ? color : 'transparent'}
              />
              <View style={[s.unreadDot, { backgroundColor: colors.error }]} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: tabLabels.marketplace,
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.5}
              fill={focused ? color : 'transparent'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color, focused }) => (
            <UserCircle2
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.5}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
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
