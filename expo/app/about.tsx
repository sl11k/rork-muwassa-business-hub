import React from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  FileText,
  Globe,
  Shield,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export default function AboutScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isRTL, language } = useLanguage();

  const links = [
    { id: 'terms', label: language === 'ar' ? 'شروط الاستخدام' : 'Terms of Service', icon: FileText, color: colors.accent },
    { id: 'privacy', label: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', icon: Shield, color: '#4A9FF5' },
    { id: 'website', label: language === 'ar' ? 'الموقع الإلكتروني' : 'Website', icon: Globe, color: '#22D3EE' },
  ];

  const handlePress = (id: string) => {
    if (id === 'website') {
      void Linking.openURL('https://muwassa.app').catch(() => {});
    }
  };

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={[s.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.bgMuted }]}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'عن التطبيق' : 'About'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={s.logoSection}>
            <View style={[s.logoCircle, { backgroundColor: colors.accent }]}>
              <Text style={s.logoText}>م</Text>
            </View>
            <Text style={[s.appName, { color: colors.text }]}>
              {language === 'ar' ? 'مُوسع' : 'Muwassa'}
            </Text>
            <Text style={[s.appTagline, { color: colors.textSecondary }]}>
              {language === 'ar' ? 'منصة الأعمال المهنية' : 'Professional Business Platform'}
            </Text>
            <Text style={[s.version, { color: colors.textMuted }]}>
              v2.0.0
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[s.descText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar'
                ? 'مُوسع هي منصة مهنية عربية تجمع رواد الأعمال والخبراء والمستشارين في مكان واحد. تقدم المنصة مجتمعات مهنية، سوق خدمات، مركز معرفة، وأدوات حوكمة وامتثال.'
                : 'Muwassa is an Arabic-first professional platform that brings together entrepreneurs, experts, and consultants. It offers professional communities, a service marketplace, knowledge hub, and governance & compliance tools.'}
            </Text>
          </View>

          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {links.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => handlePress(item.id)}
                style={({ pressed }) => [
                  s.row,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border },
                  idx === links.length - 1 && { borderBottomWidth: 0 },
                  pressed && { backgroundColor: colors.bgMuted },
                ]}
              >
                <View style={[s.iconWrap, { backgroundColor: item.color + '15' }]}>
                  <item.icon color={item.color} size={18} />
                </View>
                <Text style={[s.rowLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>{item.label}</Text>
                <ExternalLink color={colors.textMuted} size={14} />
              </Pressable>
            ))}
          </View>

          <View style={s.infoSection}>
            <Text style={[s.infoLabel, { color: colors.textMuted }]}>
              {language === 'ar' ? 'النظام' : 'Platform'}
            </Text>
            <Text style={[s.infoValue, { color: colors.textSecondary }]}>
              {Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web'} · Expo SDK 54
            </Text>
          </View>

          <Text style={[s.copyright, { color: colors.textMuted }]}>
            © 2026 Muwassa. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  scrollContent: { padding: 16, gap: 20 },
  logoSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  logoCircle: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#FFF', fontSize: 32, fontWeight: '700' as const },
  appName: { fontSize: 24, fontWeight: '700' as const },
  appTagline: { fontSize: 14 },
  version: { fontSize: 13, marginTop: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  descText: { fontSize: 14, lineHeight: 24, padding: 16 },
  row: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '500' as const },
  infoSection: { alignItems: 'center', gap: 4 },
  infoLabel: { fontSize: 12, fontWeight: '600' as const, textTransform: 'uppercase' as const },
  infoValue: { fontSize: 13 },
  copyright: { fontSize: 12, textAlign: 'center' },
});
