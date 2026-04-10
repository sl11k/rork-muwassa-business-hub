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
import { BlurView } from 'expo-blur';

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

  const activeColor = colors.accent;
  const inactiveColor = isDark ? '#444448' : '#B0B0B4';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 72 } : {}),
        },
        tabBarBackground: () => (
          Platform.OS === 'web' ? (
            <View style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
              },
            ]} />
          ) : (
            <BlurView
              intensity={isDark ? 80 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.1,
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
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeLine, { backgroundColor: activeColor }]} />}
              <Home color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: tabLabels.communities,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeLine, { backgroundColor: activeColor }]} />}
              <Compass color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: tabLabels.messages,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeLine, { backgroundColor: activeColor }]} />}
              <MessageSquare color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: tabLabels.marketplace,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeLine, { backgroundColor: activeColor }]} />}
              <ShoppingBag color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: tabLabels.more,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && <View style={[s.activeLine, { backgroundColor: activeColor }]} />}
              <User color={color} size={22} strokeWidth={focused ? 2.2 : 1.5} />
            </View>
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
    width: 48,
    height: 32,
  },
  activeLine: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 2.5,
    borderRadius: 2,
  },
});
