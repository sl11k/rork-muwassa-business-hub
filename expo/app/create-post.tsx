import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import {
  FileText,
  Image as ImageIcon,
  Link2,
  Trash2,
  X,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import type { PostAttachment } from '@/types/post';

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
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const topics = language === 'ar' ? TOPICS_AR : TOPICS_EN;
  const canPost = content.trim().length > 10 && selectedTopic !== null;

  const createMutation = useMutation({
    mutationFn: async () => {
      const topic = selectedTopic !== null ? topics[selectedTopic] : '';
      console.log('[CreatePost] submitting:', { content: content.trim(), topic, attachments: attachments.length });
      return trpcClient.posts.create.mutate({
        content: content.trim(),
        topic,
        attachments,
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

  const handlePickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setAttachments((prev) => [...prev, {
          type: 'image' as const,
          url: asset.uri,
          name: asset.fileName || 'image.jpg',
        }]);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.log('[CreatePost] image picker error', err);
    }
  }, []);

  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setAttachments((prev) => [...prev, {
          type: 'file' as const,
          url: asset.uri,
          name: asset.name || 'file',
        }]);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.log('[CreatePost] file picker error', err);
    }
  }, []);

  const handleAddLink = useCallback(() => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setAttachments((prev) => [...prev, {
      type: 'link' as const,
      url,
      name: url,
    }]);
    setLinkUrl('');
    setLinkModalVisible(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [linkUrl]);

  const handleRemoveAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

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

            <View style={styles.attachSection}>
              <Text style={[styles.topicLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {language === 'ar' ? 'إضافة مرفقات' : 'Add attachments'}
              </Text>
              <View style={[styles.attachBtns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable
                  onPress={handlePickImage}
                  style={({ pressed }) => [styles.attachBtn, { backgroundColor: colors.accentLight }, pressed && { opacity: 0.7 }]}
                >
                  <ImageIcon color={colors.accent} size={18} strokeWidth={1.5} />
                  <Text style={[styles.attachBtnText, { color: colors.accent }]}>
                    {language === 'ar' ? 'صورة' : 'Image'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handlePickFile}
                  style={({ pressed }) => [styles.attachBtn, { backgroundColor: colors.bgMuted }, pressed && { opacity: 0.7 }]}
                >
                  <FileText color={colors.textSecondary} size={18} strokeWidth={1.5} />
                  <Text style={[styles.attachBtnText, { color: colors.textSecondary }]}>
                    {language === 'ar' ? 'ملف' : 'File'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLinkModalVisible(true)}
                  style={({ pressed }) => [styles.attachBtn, { backgroundColor: colors.bgMuted }, pressed && { opacity: 0.7 }]}
                >
                  <Link2 color={colors.textSecondary} size={18} strokeWidth={1.5} />
                  <Text style={[styles.attachBtnText, { color: colors.textSecondary }]}>
                    {language === 'ar' ? 'رابط' : 'Link'}
                  </Text>
                </Pressable>
              </View>

              {attachments.length > 0 && (
                <View style={styles.attachList}>
                  {attachments.map((att, idx) => (
                    <View key={idx} style={[styles.attachItem, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.bgMuted, borderColor: colors.border }]}>
                      {att.type === 'image' && <ImageIcon color={colors.accent} size={16} strokeWidth={1.5} />}
                      {att.type === 'file' && <FileText color={colors.sky ?? colors.accent} size={16} strokeWidth={1.5} />}
                      {att.type === 'link' && <Link2 color={colors.accent} size={16} strokeWidth={1.5} />}
                      <Text style={[styles.attachItemText, { color: colors.text }]} numberOfLines={1}>{att.name || att.url}</Text>
                      <Pressable onPress={() => handleRemoveAttachment(idx)} hitSlop={8}>
                        <Trash2 color={colors.error} size={14} strokeWidth={1.5} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.toolbar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1 }} />
            <Text style={styles.charCount}>{content.length}</Text>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={linkModalVisible} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'ar' ? 'إضافة رابط' : 'Add Link'}
              </Text>
              <TextInput
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="https://example.com"
                placeholderTextColor={colors.textMuted}
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.bg }]}
                autoCapitalize="none"
                keyboardType="url"
                autoFocus
              />
              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => { setLinkModalVisible(false); setLinkUrl(''); }}
                  style={[styles.modalCancelBtn, { backgroundColor: colors.bgMuted }]}
                >
                  <Text style={[styles.modalCancelText, { color: colors.text }]}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddLink}
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.modalConfirmText}>{language === 'ar' ? 'إضافة' : 'Add'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

const createStyles = (c: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bgCard },
  safe: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: c.bgMuted, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' as const, color: c.text },
  publishBtn: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: theme.radius.full, backgroundColor: c.accent, minWidth: 70, alignItems: 'center',
  },
  publishBtnDisabled: { backgroundColor: c.bgMuted },
  publishText: { color: c.white, fontSize: 14, fontWeight: '700' as const },
  publishTextDisabled: { color: c.textMuted },
  scrollContent: { padding: 20, gap: 20 },
  authorRow: { alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.white, fontSize: 16, fontWeight: '700' as const },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontWeight: '700' as const, color: c.text },
  authorRole: { fontSize: 12, color: c.textMuted },
  contentInput: { fontSize: 17, lineHeight: 28, color: c.text, minHeight: 120, textAlignVertical: 'top' as const },
  topicSection: { gap: 10 },
  topicLabel: { fontSize: 14, fontWeight: '600' as const, color: c.textSecondary },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.radius.full, backgroundColor: c.bgMuted },
  topicPillActive: { backgroundColor: c.accent },
  topicText: { fontSize: 13, fontWeight: '600' as const, color: c.textSecondary },
  topicTextActive: { color: c.white },
  attachSection: { gap: 12 },
  attachBtns: { gap: 10 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
  },
  attachBtnText: { fontSize: 13, fontWeight: '600' as const },
  attachList: { gap: 8 },
  attachItem: {
    alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  attachItemText: { flex: 1, fontSize: 13 },
  toolbar: {
    alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.divider,
  },
  charCount: { fontSize: 13, color: c.textMuted, fontWeight: '500' as const },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 32 },
  modalContainer: { width: '100%', borderRadius: 18, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' },
  modalInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  modalCancelText: { fontSize: 15, fontWeight: '600' as const },
  modalConfirmBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const },
});
