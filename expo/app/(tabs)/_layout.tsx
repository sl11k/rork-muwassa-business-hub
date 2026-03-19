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
import { LinearGradient } from 'expo-linear-gradient';

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
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          position: 'absolute',
          elevation: 0,
          ...(Platform.OS === 'web' ? { height: 72 } : {}),
        },
        tabBarBackground: () => (
          Platform.OS === 'web' ? (
            <View style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(10,14,26,0.96)' : 'rgba(255,255,255,0.96)',
                borderTopWidth: 0.5,
                borderTopColor: isDark ? 'rgba(0,201,167,0.1)' : 'rgba(0,0,0,0.05)',
              },
            ]} />
          ) : (
            <BlurView
              intensity={95}
              tint={isDark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderTopWidth: 0.5,
                  borderTopColor: isDark ? 'rgba(0,201,167,0.1)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600' as const,
          letterSpacing: 0.3,
          marginTop: -2,
        },
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: tabLabels.home,
          tabBarIcon: ({ color, focused }) => (
            <View style={s.iconWrap}>
              {focused && (
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.activeDot}
                />
              )}
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
              {focused && (
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.activeDot}
                />
              )}
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
              {focused && (
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.activeDot}
                />
              )}
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
              {focused && (
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.activeDot}
                />
              )}
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
              {focused && (
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.activeDot}
                />
              )}
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
  activeDot: {
    position: 'absolute',
    top: -4,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
