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
  Globe,
  Lock,
  Mail,
  UserRound,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const router = useRouter();
  const { isRTL, language, toggleLanguage } = useLanguage();
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const _theme = useTheme();

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
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={[styles.topBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]} testID="login-back">
            {isRTL ? (
              <ArrowRight color="#FFFFFF" size={20} strokeWidth={1.8} />
            ) : (
              <ArrowLeft color="#FFFFFF" size={20} strokeWidth={1.8} />
            )}
          </Pressable>
          <Pressable onPress={toggleLanguage} style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.7 }]}>
            <Globe color="rgba(255,255,255,0.6)" size={15} strokeWidth={1.5} />
            <Text style={styles.langText}>{language === 'ar' ? 'English' : 'العربية'}</Text>
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
              <Text style={[styles.heroTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')
                  : (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
                }
              </Text>
              <Text style={[styles.heroSub, { textAlign: isRTL ? 'right' : 'left' }]}>
                {mode === 'login'
                  ? (language === 'ar' ? 'ادخل إلى مجتمعك المهني' : 'Access your professional community')
                  : (language === 'ar' ? 'انضم إلى المنصة المهنية الأولى' : 'Join the premier professional platform')
                }
              </Text>
            </View>

            <View style={styles.tabRow}>
              <Pressable
                onPress={() => switchMode('login')}
                style={[styles.tab, mode === 'login' && styles.tabActive]}
              >
                <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                  {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchMode('register')}
                style={[styles.tab, mode === 'register' && styles.tabActive]}
              >
                <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                  {language === 'ar' ? 'حساب جديد' : 'Register'}
                </Text>
              </Pressable>
            </View>

            <Animated.View style={[styles.formSection, { opacity: fadeAnim }]}>
              {mode === 'register' ? (
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </Text>
                  <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <UserRound color="rgba(255,255,255,0.35)" size={18} strokeWidth={1.5} />
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder={language === 'ar' ? 'أدخل اسمك...' : 'Enter your name...'}
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                      autoCapitalize="words"
                      testID="register-name"
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </Text>
                <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Mail color="rgba(255,255,255,0.35)" size={18} strokeWidth={1.5} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID="auth-email"
                  />
                </View>
              </View>

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </Text>
                <View style={[styles.fieldInput, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Lock color="rgba(255,255,255,0.35)" size={18} strokeWidth={1.5} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={language === 'ar' ? '٦ أحرف على الأقل' : 'At least 6 characters'}
                    placeholderTextColor="rgba(255,255,255,0.25)"
                    style={[styles.input, { textAlign: isRTL ? 'right' : 'left', flex: 1 }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    testID="auth-password"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                    {showPassword ? (
                      <EyeOff color="rgba(255,255,255,0.35)" size={18} strokeWidth={1.5} />
                    ) : (
                      <Eye color="rgba(255,255,255,0.35)" size={18} strokeWidth={1.5} />
                    )}
                  </Pressable>
                </View>
              </View>

              {displayError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleSubmit}
                disabled={isPending}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && !isPending && { opacity: 0.85 },
                  isPending && styles.submitBtnDisabled,
                ]}
                testID="auth-submit"
              >
                {isPending ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
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
    backgroundColor: theme.colors.bg,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  langText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500' as const,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  heroSection: {
    gap: 10,
    marginTop: 32,
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.37,
  },
  heroSub: {
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 28,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.accent,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: -0.24,
  },
  tabTextActive: {
    color: '#0A0A0F',
  },
  formSection: {
    gap: 20,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: -0.08,
  },
  fieldInput: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 0,
    letterSpacing: -0.32,
  },
  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.2)',
  },
  errorText: {
    fontSize: 14,
    color: '#FF6961',
    fontWeight: '500' as const,
    textAlign: 'center',
    letterSpacing: -0.08,
  },
  submitBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
});
