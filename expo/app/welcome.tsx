// Muwassa Business Hub — welcome screen
import React, { useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Globe, Shield, TrendingUp, Users } from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

function FeatureItem({ icon: Icon, title, color, textColor, delay }: { icon: typeof Users; title: string; color: string; textColor: string; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, delay]);

  return (
    <Animated.View style={[styles.featureItem, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[styles.featureIcon, { backgroundColor: color + '15' }]}>
        <Icon color={color} size={20} strokeWidth={1.5} />
      </View>
      <Text style={[styles.featureText, { color: textColor }]}>{title}</Text>
    </Animated.View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const { colors } = useTheme();
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [heroFade, heroSlide]);

  const { enterGuest } = useAuth();

  const handleGetStarted = useCallback(() => {
    console.log('[Welcome] navigating to login');
    router.push('/login');
  }, [router]);

  const handleGuest = useCallback(() => {
    console.log('[Welcome] entering as guest');
    enterGuest();
    router.replace('/(tabs)');
  }, [router, enterGuest]);

  const features = language === 'ar'
    ? [
        { icon: Users, title: 'مجتمعات مهنية', color: colors.accent, textColor: colors.textSecondary },
        { icon: TrendingUp, title: 'سوق الخدمات', color: colors.warning, textColor: colors.textSecondary },
        { icon: Shield, title: 'مركز الحوكمة', color: colors.accent, textColor: colors.textSecondary },
      ]
    : [
        { icon: Users, title: 'Professional communities', color: colors.accent, textColor: colors.textSecondary },
        { icon: TrendingUp, title: 'Services marketplace', color: colors.warning, textColor: colors.textSecondary },
        { icon: Shield, title: 'Governance hub', color: colors.accent, textColor: colors.textSecondary },
      ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.langRow, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]}>
          <Pressable onPress={toggleLanguage} style={({ pressed }) => [styles.langBtn, { backgroundColor: colors.bgMuted }, pressed && { opacity: 0.7 }]}>
            <Globe color={colors.textSecondary} size={15} strokeWidth={1.5} />
            <Text style={[styles.langText, { color: colors.textSecondary }]}>{language === 'ar' ? 'English' : 'العربية'}</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Animated.View style={[styles.hero, { opacity: heroFade, transform: [{ translateY: heroSlide }] }]}>
            <Text style={[styles.appName, { color: colors.text, textAlign: 'center' }]}>
              {language === 'ar' ? 'مُوَثَّق' : 'Muwassa'}
            </Text>
            <Text style={[styles.appSub, { color: colors.textSecondary, textAlign: 'center' }]}>Business Hub</Text>
            <View style={[styles.accentLine, { backgroundColor: colors.accent }]} />
          </Animated.View>

          <View style={styles.features}>
            {features.map((f, i) => (
              <FeatureItem key={i} icon={f.icon} title={f.title} color={f.color} textColor={f.textColor} delay={300 + i * 150} />
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
            testID="welcome-enter-btn"
          >
            <Text style={styles.primaryBtnText}>
              {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleGuest}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            testID="welcome-guest-btn"
          >
            <Text style={[styles.guestBtnText, { color: colors.textSecondary }]}>
              {language === 'ar' ? 'تصفح كزائر' : 'Browse as Guest'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  langRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  langText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 44,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  appSub: {
    fontSize: 15,
  },
  accentLine: {
    width: 24,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },
  features: {
    gap: 16,
    paddingHorizontal: 0,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400' as const,
  },
  actions: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 8,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  guestBtnText: {
    fontSize: 15,
    paddingVertical: 8,
  },
});
