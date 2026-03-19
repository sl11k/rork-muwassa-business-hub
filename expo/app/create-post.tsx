import React, { useMemo, useState } from 'react';
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
import {
  FileText,
  Image as ImageIcon,
  Link2,
  X,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';

const TOPICS_AR = ['ريادة الأعمال', 'استراتيجية النمو', 'الحوكمة والامتثال', 'التسويق', 'التمويل', 'التقنية', 'القيادة', 'الاستثمار', 'العمليات'];
const TOPICS_EN = ['Entrepreneurship', 'Growth Strategy', 'Governance & Compliance', 'Marketing', 'Finance', 'Technology', 'Leadership', 'Investment', 'Operations'];

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { profile, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  const topics = language === 'ar' ? TOPICS_AR : TOPICS_EN;
  const canPost = content.trim().length > 10 && selectedTopic !== null;

  const createMutation = useMutation({
    mutationFn: async () => {
      const topic = selectedTopic !== null ? topics[selectedTopic] : '';
      console.log('[CreatePost] submitting:', { content: content.trim(), topic });
      return trpcClient.posts.create.mutate({
        content: content.trim(),
        topic,
      });
    },
    onSuccess: () => {
      console.log('[CreatePost] post created successfully');
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      router.back();
    },
    onError: (err) => {
      console.log('[CreatePost] error:', err.message);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل نشر المنشور. حاول مرة أخرى.' : 'Failed to publish post. Please try again.',
      );
    },
  });

  const handlePost = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!canPost) return;
    createMutation.mutate();
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn} testID="create-post-close">
            <X color={colors.text} size={20} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === 'ar' ? 'منشور جديد' : 'New Post'}
          </Text>
          <Pressable
            onPress={handlePost}
            disabled={!canPost || createMutation.isPending}
            style={[styles.publishBtn, (!canPost || createMutation.isPending) && styles.publishBtnDisabled]}
            testID="create-post-publish"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.publishText, !canPost && styles.publishTextDisabled]}>
                {language === 'ar' ? 'نشر' : 'Publish'}
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.authorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={[styles.authorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.authorName}>
                  {profile?.name || (language === 'ar' ? 'مستخدم' : 'User')}
                </Text>
                <Text style={styles.authorRole}>
                  {profile?.role || (language === 'ar' ? 'عضو' : 'Member')}
                </Text>
              </View>
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={language === 'ar' ? 'شارك رأيك، تحليلاً، أو سؤالاً مهنياً...' : 'Share an insight, analysis, or professional question...'}
              placeholderTextColor={colors.textMuted}
              style={[styles.contentInput, { textAlign: isRTL ? 'right' : 'left' }]}
              multiline
              autoFocus
              testID="create-post-input"
            />

            <View style={styles.topicSection}>
              <Text style={[styles.topicLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'اختر موضوع المنشور' : 'Choose a topic'}
              </Text>
              <View style={styles.topicGrid}>
                {topics.map((topic, index) => (
                  <Pressable
                    key={topic}
                    onPress={() => setSelectedTopic(selectedTopic === index ? null : index)}
                    style={[styles.topicPill, selectedTopic === index && styles.topicPillActive]}
                  >
                    <Text style={[styles.topicText, selectedTopic === index && styles.topicTextActive]}>{topic}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={[styles.toolbar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}>
              <ImageIcon color={colors.textSecondary} size={20} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}>
              <FileText color={colors.textSecondary} size={20} />
            </Pressable>
            <Pressable style={({ pressed }) => [styles.toolBtn, pressed && styles.pressed]}>
              <Link2 color={colors.textSecondary} size={20} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Text style={styles.charCount}>{content.length}</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

const createStyles = (c: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.bgCard,
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
    borderBottomColor: c.divider,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
  },
  publishBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: theme.radius.full,
    backgroundColor: c.accent,
    minWidth: 70,
    alignItems: 'center',
  },
  publishBtnDisabled: {
    backgroundColor: c.bgMuted,
  },
  publishText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  publishTextDisabled: {
    color: c.textMuted,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  authorRow: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: c.text,
  },
  authorRole: {
    fontSize: 12,
    color: c.textMuted,
  },
  contentInput: {
    fontSize: 17,
    lineHeight: 28,
    color: c.text,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  topicSection: {
    gap: 10,
  },
  topicLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgMuted,
  },
  topicPillActive: {
    backgroundColor: c.accent,
  },
  topicText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textSecondary,
  },
  topicTextActive: {
    color: c.white,
  },
  toolbar: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: c.bgMuted,
  },
  charCount: {
    fontSize: 13,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
});
