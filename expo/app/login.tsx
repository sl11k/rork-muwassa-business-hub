import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
} from 'lucide-react-native';

import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const { colors } = useTheme();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const switchMode = useCallback((newMode: AuthMode) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMode(newMode);
      setLocalError(null);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    void Haptics.selectionAsync();
  }, [fadeAnim]);

  const isPending = isLoggingIn || isRegistering;

  const handleSubmit = useCallback(async () => {
    setLocalError(null);

    if (!email.trim()) {
      setLocalError(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Email is required');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setLocalError(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (mode === 'register' && !name.trim()) {
      setLocalError(language === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (mode === 'login') {
        await login({ email: email.trim(), password });
      } else {
        await register({ email: email.trim(), password, name: name.trim() });
      }
      console.log('[Login] success, navigating to tabs');
      router.replace('/(tabs)');
    } catch (err) {
      console.log('[Login] submit error', err);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [email, password, name, mode, language, login, register, router]);

  const serverError = mode === 'login' ? loginError : registerError;
  const displayError = localError ?? serverError;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} testID="login-back">
            {isRTL ? (
              <ArrowRight color={colors.text} size={20} strokeWidth={2} />
            ) : (
              <ArrowLeft color={colors.text} size={20} strokeWidth={2} />
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.heroSection}>
              <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                  : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                }
              </Text>
              <Text style={[styles.heroSub, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'مرحباً بعودتك' : 'Welcome back')
                  : (language === 'ar' ? 'انضم إلى المنصة المهنية الأولى' : 'Join the premier professional platform')
                }
              </Text>
            </View>

            <View style={[styles.tabRow, { backgroundColor: colors.bgMuted }]}>
              <Pressable
                onPress={() => switchMode('login')}
                style={[styles.tab, mode === 'login' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'login' && styles.tabTextActive]}>
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('register')}
                style={[styles.tab, mode === 'register' && { backgroundColor: colors.accent }]}
              >
                <Text style={[styles.tabText, { color: colors.textMuted }, mode === 'register' && styles.tabTextActive]}>
                  {language === 'ar' ? 'حساب جديد' : 'Register'}
                </Text>
              </Pressable>
            </View>

            <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
              {mode === 'register' ? (
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </Text>
                  <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                    <UserRound color={colors.textMuted} size={18} strokeWidth={1.5} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
                      placeholderTextColor={colors.textMuted}
                      style={[styles.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                      autoCapitalize="words"
                      testID="register-name"
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Text>
                <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Mail color={colors.textMuted} size={18} strokeWidth={1.5} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="auth-email"
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Text>
                <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                  <Lock color={colors.textMuted} size={18} strokeWidth={1.5} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={language === 'ar' ? '٦ أحرف على الأقل' : 'At least 6 characters'}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1, color: colors.text }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    testID="auth-password"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? (
                      <EyeOff color={colors.textMuted} size={18} strokeWidth={1.5} />
                    ) : (
                      <Eye color={colors.textMuted} size={18} strokeWidth={1.5} />
                    )}
                  </Pressable>
                </View>
              </View>

              {displayError ? (
                <View style={[styles.errorBox, { backgroundColor: colors.errorLight, borderColor: colors.error + '30' }]}>
                  <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: colors.accent },
                  pressed && !isPending && { opacity: 0.85 },
                  isPending && styles.submitBtnDisabled,
                ]}
                testID="auth-submit"
              >
                {isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === 'login'
                      ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                      : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                    }
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroSection: {
    gap: 6,
    marginTop: 24,
    marginBottom: 28,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  heroSub: {
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  formSection: {
    gap: 16,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  fieldInput: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
