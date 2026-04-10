import React, { useMemo, useState, useCallback } from 'react';
import {
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
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Toast } from '@/components/Toast';

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleSave = useCallback(() => {
    if (!currentPassword.trim()) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'يرجى إدخال كلمة المرور الحالية' : 'Please enter current password');
      setToastVisible(true);
      return;
    }
    if (newPassword.length < 6) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' : 'New password must be at least 6 characters');
      setToastVisible(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setToastType('error');
      setToastMsg(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      setToastVisible(true);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastType('success');
    setToastMsg(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
    setToastVisible(true);
    setTimeout(() => router.back(), 1200);
  }, [currentPassword, newPassword, confirmPassword, language, router]);

  const renderField = (label: string, value: string, onChange: (t: string) => void, show: boolean, toggleShow: () => void, placeholder: string) => (
    <View style={s.fieldWrap}>
      <Text style={[s.label, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>{label}</Text>
      <View style={[s.inputRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Lock color={colors.textMuted} size={18} />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!show}
          style={[s.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
        />
        <Pressable onPress={toggleShow} hitSlop={8}>
          {show ? <EyeOff color={colors.textMuted} size={18} /> : <Eye color={colors.textMuted} size={18} />}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[s.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={[s.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider ?? colors.border, backgroundColor: colors.bgCard }]}>
          <Pressable onPress={() => router.back()} style={[s.backBtn, { backgroundColor: colors.bgMuted }]}>
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            {renderField(
              language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password',
              currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent(v => !v),
              language === 'ar' ? 'أدخل كلمة المرور الحالية' : 'Enter current password'
            )}
            {renderField(
              language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password',
              newPassword, setNewPassword, showNew, () => setShowNew(v => !v),
              language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter new password'
            )}
            {renderField(
              language === 'ar' ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password',
              confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm(v => !v),
              language === 'ar' ? 'أعد إدخال كلمة المرور الجديدة' : 'Re-enter new password'
            )}

            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
            >
              <Text style={s.saveBtnText}>{language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
        <Toast visible={toastVisible} message={toastMsg} type={toastType} onDismiss={() => setToastVisible(false)} />
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
  scrollContent: { padding: 20, gap: 4 },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600' as const, marginBottom: 6 },
  inputRow: { alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  saveBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
});
