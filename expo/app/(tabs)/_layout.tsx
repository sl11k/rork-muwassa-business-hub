import { Tabs } from 'expo-router';
import {
  Compass,
  Home,
  MessageSquare,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

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

  const activeColor = colors.accent;
  const inactiveColor = colors.textMuted;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 72 } : {}),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabLabels.home,
          tabBarIcon: ({ color, focused }) => (
            <Home color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: tabLabels.communities,
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: tabLabels.messages,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              <MessageSquare color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
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
            <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
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
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
