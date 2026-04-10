// Muwassa Business Hub — create-community screen
import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Lock,
  Crown,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { Toast } from '@/components/Toast';

const ICONS = ['🏢', '📊', '💡', '🚀', '⚖️', '💰', '🎯', '📈', '🤝', '🔒', '💻', '🌍'];
const ACCENT_COLORS = ['#0F8B8D', '#1D4ED8', '#12B76A', '#C8A96B', '#0C6F70', '#1E40AF', '#14B8A6', '#2563EB', '#EF4444', '#F59E0B'];

type PrivacyType = 'public' | 'private' | 'premium';

export default function CreateCommunityScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [privacy, setPrivacy] = useState<PrivacyType>('public');
  const [selectedIcon, setSelectedIcon] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const createMutation = useMutation({
    mutationFn: () => trpcClient.communities.create.mutate({
      name: name.trim(),
      nameAr: nameAr.trim(),
      description: description.trim(),
      descriptionAr: descriptionAr.trim(),
      privacy,
      icon: ICONS[selectedIcon],
      accent: ACCENT_COLORS[selectedColor],
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastType('success');
      setToastMsg(language === 'ar' ? 'تم إنشاء المجتمع بنجاح!' : 'Community created!');
      setToastVisible(true);
      setTimeout(() => router.back(), 1000);
    },
    onError: (err) => {
      console.log('[CreateCommunity] error', err.message);
      setToastType('error');
      setToastMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      setToastVisible(true);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !nameAr.trim()) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى إدخال اسم المجتمع' : 'Please enter community name');
      setToastVisible(true);
      return;
    }
    if (!description.trim() || !descriptionAr.trim()) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى إدخال وصف المجتمع' : 'Please enter community description');
      setToastVisible(true);
      return;
    }
    createMutation.mutate();
  }, [name, nameAr, description, descriptionAr, createMutation, language]);

  const privacyOptions: { key: PrivacyType; label: string; icon: typeof Globe; desc: string }[] = [
    {
      key: 'public',
      label: language === 'ar' ? 'عام' : 'Public',
      icon: Globe,
      desc: language === 'ar' ? 'أي شخص يمكنه الانضمام ورؤية المحتوى' : 'Anyone can join and see content',
    },
    {
      key: 'private',
      label: language === 'ar' ? 'خاص' : 'Private',
      icon: Lock,
      desc: language === 'ar' ? 'المحتوى مرئي فقط للأعضاء' : 'Content visible only to members',
    },
  ];

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'يرجى تسجيل الدخول' : 'Please login first'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.navTitle}>
            {language === 'ar' ? 'إنشاء مجتمع' : 'Create Community'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'اسم المجتمع (إنجليزي)' : 'Community Name (English)'}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
              value={name}
              onChangeText={setName}
              placeholder={language === 'ar' ? 'أدخل الاسم بالإنجليزية' : 'Enter name in English'}
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'اسم المجتمع (عربي)' : 'Community Name (Arabic)'}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: 'right' }]}
              value={nameAr}
              onChangeText={setNameAr}
              placeholder="أدخل الاسم بالعربية"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: isRTL ? 'right' : 'left' }]}
              value={description}
              onChangeText={setDescription}
              placeholder={language === 'ar' ? 'وصف المجتمع بالإنجليزية' : 'Describe the community'}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { textAlign: 'right' }]}
              value={descriptionAr}
              onChangeText={setDescriptionAr}
              placeholder="وصف المجتمع بالعربية"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الخصوصية' : 'Privacy'}
            </Text>
            <View style={styles.privacyRow}>
              {privacyOptions.map((opt) => (
                <Pressable
                  key={opt.key}
                  onPress={() => { setPrivacy(opt.key); void Haptics.selectionAsync(); }}
                  style={[
                    styles.privacyCard,
                    {
                      backgroundColor: privacy === opt.key ? colors.accentLight : colors.bgCard,
                      borderColor: privacy === opt.key ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <opt.icon color={privacy === opt.key ? colors.accent : colors.textMuted} size={18} strokeWidth={1.5} />
                  <Text style={[styles.privacyLabel, { color: privacy === opt.key ? colors.accent : colors.text }]}>{opt.label}</Text>
                  <Text style={[styles.privacyDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'الأيقونة' : 'Icon'}
            </Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon, idx) => (
                <Pressable
                  key={icon}
                  onPress={() => setSelectedIcon(idx)}
                  style={[
                    styles.iconItem,
                    {
                      backgroundColor: selectedIcon === idx ? colors.accentLight : colors.bgCard,
                      borderColor: selectedIcon === idx ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{icon}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {language === 'ar' ? 'اللون' : 'Color'}
            </Text>
            <View style={styles.colorGrid}>
              {ACCENT_COLORS.map((color, idx) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(idx)}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedColor === idx && { borderWidth: 3, borderColor: colors.text },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }, createMutation.isPending && { opacity: 0.6 }]}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {language === 'ar' ? 'إنشاء المجتمع' : 'Create Community'}
                </Text>
              )}
            </Pressable>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        <Toast visible={toastVisible} message={toastMsg} type={toastType} onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

const createStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  safe: { flex: 1 },
  errorText: { fontSize: 16, color: c.textMuted, textAlign: 'center', marginTop: 40 },
  navBar: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.divider, backgroundColor: c.bgCard },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.bgMuted, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700' as const, color: c.text },
  scrollContent: { padding: 20, gap: 4 },
  label: { fontSize: 13, fontWeight: '600' as const, color: c.textSecondary, marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: c.bgCard, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text },
  textArea: { minHeight: 80, paddingTop: 12 },
  privacyRow: { flexDirection: 'row', gap: 10 },
  privacyCard: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 6 },
  privacyLabel: { fontSize: 14, fontWeight: '600' as const },
  privacyDesc: { fontSize: 11, textAlign: 'center' as const, lineHeight: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconItem: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorItem: { width: 40, height: 40, borderRadius: 20 },
  submitBtn: { marginTop: 28, paddingVertical: 16, borderRadius: 14, backgroundColor: c.accent, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
});
