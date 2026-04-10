// Muwassa Business Hub — help-support screen
import React from 'react';
import {
  Linking,
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
  FileQuestion,
  HeadphonesIcon,
  Mail,
  MessageSquare,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export default function HelpSupportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isRTL, language } = useLanguage();

  const items = [
    {
      id: 'faq',
      label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ',
      desc: language === 'ar' ? 'إجابات على الأسئلة المتكررة' : 'Answers to frequently asked questions',
      icon: FileQuestion,
      color: colors.accent,
    },
    {
      id: 'contact',
      label: language === 'ar' ? 'تواصل معنا' : 'Contact Us',
      desc: language === 'ar' ? 'أرسل لنا رسالة وسنرد في أقرب وقت' : 'Send us a message and we will respond ASAP',
      icon: Mail,
      color: colors.secondary,
    },
    {
      id: 'feedback',
      label: language === 'ar' ? 'إرسال ملاحظات' : 'Send Feedback',
      desc: language === 'ar' ? 'ساعدنا في تحسين التطبيق' : 'Help us improve the app',
      icon: MessageSquare,
      color: colors.error,
    },
    {
      id: 'live',
      label: language === 'ar' ? 'الدعم المباشر' : 'Live Support',
      desc: language === 'ar' ? 'تحدث مع فريق الدعم مباشرة' : 'Chat with our support team directly',
      icon: HeadphonesIcon,
      color: colors.info,
    },
  ];

  const handlePress = (id: string) => {
    if (id === 'contact') {
      void Linking.openURL('mailto:support@muwassa.app').catch(() => {});
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
            {language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {items.map((item, idx) => (
              <Pressable
                key={item.id}
                onPress={() => handlePress(item.id)}
                style={({ pressed }) => [
                  s.row,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border },
                  idx === items.length - 1 && { borderBottomWidth: 0 },
                  pressed && { backgroundColor: colors.bgMuted },
                ]}
              >
                <View style={[s.iconWrap, { backgroundColor: item.color + '15' }]}>
                  <item.icon color={item.color} size={18} />
                </View>
                <View style={[s.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[s.rowLabel, { color: colors.text }]}>{item.label}</Text>
                  <Text style={[s.rowDesc, { color: colors.textMuted }]}>{item.desc}</Text>
                </View>
                <ChevronRight color={colors.textMuted} size={16} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
              </Pressable>
            ))}
          </View>

          <Text style={[s.footerText, { color: colors.textMuted }]}>
            {language === 'ar' ? 'support@muwassa.app' : 'support@muwassa.app'}
          </Text>
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
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '500' as const },
  rowDesc: { fontSize: 12 },
  footerText: { fontSize: 13, textAlign: 'center' },
});
