import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import {
  House,
  Search,
  Send,
  Store,
  CircleUserRound,
} from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useTheme } from '@/providers/ThemeProvider';

export default function TabLayout() {
  const { language } = useLanguage();
  const { colors } = useTheme();

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
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg + 'E6',
          borderTopWidth: 0,
          position: 'absolute' as const,
          bottom: 20,
          left: 16,
          right: 16,
          borderRadius: 28,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
          borderWidth: 1,
          borderColor: colors.border + '40',
          ...(Platform.OS === 'web' ? { height: 64 } : { height: 64 }),
          paddingBottom: Platform.OS === 'ios' ? 0 : 0,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 6 : 8,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
        tabBarBackground: () => (
          Platform.OS === 'web' ? null : (
            <View style={[StyleSheet.absoluteFill, { 
              backgroundColor: colors.tabBarBg + 'CC',
              borderRadius: 28,
              overflow: 'hidden',
            }]}>
              <View style={[StyleSheet.absoluteFill, { 
                backgroundColor: colors.bg === '#0C0C0E' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
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
            <House
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
            <Search
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
              <Send
                color={color}
                size={20}
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
            <Store
              color={color}
              size={22}
              strokeWidth={focused ? 2.2 : 1.5}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color, focused }) => (
            <CircleUserRound
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
