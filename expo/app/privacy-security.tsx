import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, Eye, Lock, Shield, UserX } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';

export default function PrivacySecurityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  const toggles = [
    { id: 'private', label: language === 'ar' ? 'ملف شخصي خاص' : 'Private Profile', desc: language === 'ar' ? 'إخفاء بياناتك عن غير المتابعين' : 'Hide your data from non-followers', icon: Eye, value: privateProfile, onChange: setPrivateProfile },
    { id: 'activity', label: language === 'ar' ? 'إظهار النشاط' : 'Show Activity', desc: language === 'ar' ? 'السماح للآخرين برؤية نشاطك' : 'Let others see your activity', icon: UserX, value: showActivity, onChange: setShowActivity },
    { id: 'online', label: language === 'ar' ? 'إظهار الحالة' : 'Show Online Status', desc: language === 'ar' ? 'إظهار حالة الاتصال للآخرين' : 'Show when you are online', icon: Shield, value: showOnline, onChange: setShowOnline },
    { id: '2fa', label: language === 'ar' ? 'المصادقة الثنائية' : 'Two-Factor Authentication', desc: language === 'ar' ? 'طبقة أمان إضافية لحسابك' : 'Extra security layer for your account', icon: Lock, value: twoFactor, onChange: setTwoFactor },
  ];

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={[s.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.bgMuted }]}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            {toggles.map((toggle, idx) => (
              <View key={toggle.id} style={[s.row, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border }, idx === toggles.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[s.iconWrap, { backgroundColor: colors.accentLight }]}>
                  <toggle.icon color={colors.accent} size={18} />
                </View>
                <View style={[s.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[s.rowLabel, { color: colors.text }]}>{toggle.label}</Text>
                  <Text style={[s.rowDesc, { color: colors.textMuted }]}>{toggle.desc}</Text>
                </View>
                <Switch
                  value={toggle.value}
                  onValueChange={(v) => { toggle.onChange(v); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  trackColor={{ false: colors.bgMuted, true: colors.accentSoft ?? colors.accentLight }}
                  thumbColor={toggle.value ? colors.accent : colors.textMuted}
                />
              </View>
            ))}
          </View>
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
  scrollContent: { padding: 16 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '500' as const },
  rowDesc: { fontSize: 12 },
});
