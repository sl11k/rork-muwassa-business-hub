// Muwassa Business Hub — settings screen
import React, { useCallback, useState } from 'react';
import {
  Modal,
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
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Lock,
  LogOut,
  Shield,
  Smartphone,
  Trash2,
  User,
} from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

interface SettingToggle {
  id: string;
  label: string;
  icon: typeof Bell;
  color: string;
  value: boolean;
}

interface SettingLink {
  id: string;
  label: string;
  icon: typeof Bell;
  color: string;
  value?: string;
  danger?: boolean;
}

function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[modalStyles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[modalStyles.container, { backgroundColor: colors.bgCard }]}>
          <Text style={[modalStyles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[modalStyles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={modalStyles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [modalStyles.cancelBtn, { backgroundColor: colors.bgMuted }, pressed && { opacity: 0.7 }]}
            >
              <Text style={[modalStyles.cancelText, { color: colors.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                modalStyles.confirmBtn,
                danger ? { backgroundColor: colors.error } : { backgroundColor: colors.accent },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[modalStyles.confirmText, { color: colors.white }]}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  React.useEffect(() => {
    if (!isAuthenticated) {
      console.log('[Settings] not authenticated, redirecting back');
      router.back();
    }
  }, [isAuthenticated, router]);

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const toggles: SettingToggle[] = [
    {
      id: 'push',
      label: language === 'ar' ? 'الإشعارات الفورية' : 'Push Notifications',
      icon: Bell,
      color: colors.secondary,
      value: pushNotifs,
    },
    {
      id: 'email',
      label: language === 'ar' ? 'إشعارات البريد الإلكتروني' : 'Email Notifications',
      icon: Bell,
      color: colors.gold,
      value: emailNotifs,
    },
    {
      id: 'private',
      label: language === 'ar' ? 'ملف شخصي خاص' : 'Private Profile',
      icon: Eye,
      color: colors.accent,
      value: privateProfile,
    },
  ];

  const handleToggle = useCallback((id: string) => {
    console.log('[Settings] toggle', id);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (id) {
      case 'push': setPushNotifs((v) => !v); break;
      case 'email': setEmailNotifs((v) => !v); break;
      case 'private': setPrivateProfile((v) => !v); break;
    }
  }, []);

  const accountLinks: SettingLink[] = [
    {
      id: 'profile',
      label: language === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile',
      icon: User,
      color: colors.accent,
    },
    {
      id: 'password',
      label: language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password',
      icon: Lock,
      color: colors.secondary,
    },
    {
      id: 'privacy',
      label: language === 'ar' ? 'الخصوصية والأمان' : 'Privacy & Security',
      icon: Shield,
      color: colors.gold,
    },
  ];

  const generalLinks: SettingLink[] = [
    {
      id: 'language',
      label: language === 'ar' ? 'اللغة' : 'Language',
      icon: Globe,
      color: colors.secondary,
      value: language === 'ar' ? 'العربية' : 'English',
    },
    {
      id: 'device',
      label: language === 'ar' ? 'معلومات الجهاز' : 'Device Info',
      icon: Smartphone,
      color: colors.textSecondary,
    },
    {
      id: 'help',
      label: language === 'ar' ? 'المساعدة والدعم' : 'Help & Support',
      icon: HelpCircle,
      color: colors.success,
    },
    {
      id: 'about',
      label: language === 'ar' ? 'عن التطبيق' : 'About',
      icon: Info,
      color: colors.secondary,
      value: 'v1.0.0',
    },
  ];

  const dangerLinks: SettingLink[] = [
    {
      id: 'logout',
      label: language === 'ar' ? 'تسجيل الخروج' : 'Sign Out',
      icon: LogOut,
      color: colors.error,
      danger: true,
    },
    {
      id: 'delete',
      label: language === 'ar' ? 'حذف الحساب' : 'Delete Account',
      icon: Trash2,
      color: colors.error,
      danger: true,
    },
  ];

  const handleLinkPress = useCallback((id: string) => {
    console.log('[Settings] pressed', id);
    if (id === 'language') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      toggleLanguage();
    }
    if (id === 'profile') router.push('/edit-profile');
    if (id === 'password') router.push('/change-password');
    if (id === 'privacy') router.push('/privacy-security');
    if (id === 'help') router.push('/help-support');
    if (id === 'about') router.push('/about');
    if (id === 'device') router.push('/about');
    if (id === 'logout') setLogoutModal(true);
    if (id === 'delete') setDeleteModal(true);
  }, [router, toggleLanguage]);

  const renderLinkItem = (item: SettingLink) => (
    <Pressable
      key={item.id}
      onPress={() => handleLinkPress(item.id)}
      style={({ pressed }) => [styles.linkItem, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider }, pressed && { backgroundColor: colors.bgMuted }]}
      testID={`setting-${item.id}`}
    >
      <View style={[styles.linkIcon, { backgroundColor: item.color + '15' }]}>
        <item.icon color={item.color} size={18} />
      </View>
      <Text style={[styles.linkLabel, item.danger && { color: colors.error }, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: item.danger ? colors.error : colors.text }]}>
        {item.label}
      </Text>
      {item.value ? (
        <Text style={[styles.linkValue, { color: colors.textMuted }]}>{item.value}</Text>
      ) : null}
      <ChevronRight
        color={colors.textMuted}
        size={16}
        style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
      />
    </Pressable>
  );

  if (!isAuthenticated) {
    return <View style={[styles.screen, { backgroundColor: colors.bg }]} />;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider, backgroundColor: colors.bgCard }]}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.bgMuted }]} testID="settings-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'الإعدادات' : 'Settings'}
          </Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} testID="settings-scroll">
          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'الحساب' : 'Account'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            {accountLinks.map(renderLinkItem)}
          </View>

          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'التفضيلات' : 'Preferences'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            {toggles.map((toggle) => (
              <View
                key={toggle.id}
                style={[styles.toggleItem, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.divider }]}
              >
                <View style={[styles.linkIcon, { backgroundColor: toggle.color + '15' }]}>
                  <toggle.icon color={toggle.color} size={18} />
                </View>
                <Text style={[styles.linkLabel, { flex: 1, textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
                  {toggle.label}
                </Text>
                <Switch
                  value={toggle.value}
                  onValueChange={() => handleToggle(toggle.id)}
                  trackColor={{ false: colors.bgMuted, true: colors.accentSoft }}
                  thumbColor={toggle.value ? colors.accent : colors.textMuted}
                />
              </View>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
            {language === 'ar' ? 'عام' : 'General'}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            {generalLinks.map(renderLinkItem)}
          </View>

          <View style={[styles.card, styles.dangerCard, { backgroundColor: colors.bgCard, borderColor: colors.errorLight }]}>
            {dangerLinks.map(renderLinkItem)}
          </View>

          <Text style={[styles.versionText, { color: colors.textMuted }]}>Business Community Hub v1.0.0</Text>
          <View style={{ height: 40 }} />
        </ScrollView>

        <ConfirmModal
          visible={logoutModal}
          title={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          message={language === 'ar' ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to sign out?'}
          confirmLabel={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
          cancelLabel={language === 'ar' ? 'إلغاء' : 'Cancel'}
          danger
          onConfirm={() => {
            setLogoutModal(false);
            console.log('[Settings] logged out');
            logout();
            router.replace('/welcome');
          }}
          onCancel={() => setLogoutModal(false)}
        />
        <ConfirmModal
          visible={deleteModal}
          title={language === 'ar' ? 'حذف الحساب' : 'Delete Account'}
          message={
            language === 'ar'
              ? 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك نهائياً.'
              : 'This action cannot be undone. All your data will be permanently deleted.'
          }
          confirmLabel={language === 'ar' ? 'حذف نهائياً' : 'Delete Permanently'}
          cancelLabel={language === 'ar' ? 'إلغاء' : 'Cancel'}
          danger
          onConfirm={() => {
            setDeleteModal(false);
            console.log('[Settings] account deleted');
          }}
          onCancel={() => setDeleteModal(false)}
        />
      </SafeAreaView>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  container: {
    width: '100%',
    borderRadius: 22,
    padding: 24,
    gap: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  scrollContent: {
    padding: 16,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dangerCard: {
    marginTop: 16,
  },
  linkItem: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  linkIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  linkValue: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginHorizontal: 4,
  },
  toggleItem: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
