// Muwassa Business Hub — create-post screen
import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
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
  ExternalLink,
} from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import type { PostAttachment } from '@/types/post';

const TOPICS_AR = ['ريادة الأعمال', 'استراتيجية النمو', 'الحوكمة والامتثال', 'التسويق', 'التمويل', 'التقنية', 'القيادة', 'الاستثمار', 'العمليات'];
const TOPICS_EN = ['Entrepreneurship', 'Growth Strategy', 'Governance & Compliance', 'Marketing', 'Finance', 'Technology', 'Leadership', 'Investment', 'Operations'];

export default function CreatePostScreen() {
  const { colors, isDark } = useTheme();
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
      const serializedAttachments = attachments.map(att => ({
        type: att.type,
        url: att.url,
        name: att.name || '',
      }));
      console.log('[CreatePost] submitting:', { content: content.trim(), topic, attachments: serializedAttachments });
      return trpcClient.posts.create.mutate({
        content: content.trim(),
        topic,
        attachments: serializedAttachments,
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
        console.log('[CreatePost] image picked:', asset.uri);
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
        console.log('[CreatePost] file picked:', asset.name, asset.uri);
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
    console.log('[CreatePost] link added:', url);
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

  const imageAttachments = attachments.filter(a => a.type === 'image');
  const fileAttachments = attachments.filter(a => a.type === 'file');
  const linkAttachments = attachments.filter(a => a.type === 'link');

  return (
    <View style={[s.screen, { backgroundColor: isDark ? colors.bgCard : colors.bg }]}>
      <SafeAreaView edges={['top']} style={s.safe}>
        <View style={[s.header, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} style={[s.closeBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]} testID="create-post-close">
            <X color={colors.text} size={20} strokeWidth={1.8} />
          </Pressable>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {language === 'ar' ? 'منشور جديد' : 'New Post'}
          </Text>
          <Pressable
            onPress={handlePost}
            disabled={!canPost || createMutation.isPending}
            style={[
              s.publishBtn,
              { backgroundColor: canPost ? colors.accent : (isDark ? colors.bgMuted : colors.bgSecondary) },
              createMutation.isPending && { opacity: 0.7 },
            ]}
            testID="create-post-publish"
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[s.publishText, { color: canPost ? '#FFF' : colors.textMuted }]}>
                {language === 'ar' ? 'نشر' : 'Publish'}
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[s.authorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[s.avatar, { backgroundColor: colors.accent }]}>
                <Text style={s.avatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
              </View>
              <View style={[s.authorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[s.authorName, { color: colors.text }]}>
                  {profile?.name || (language === 'ar' ? 'مستخدم' : 'User')}
                </Text>
                <Text style={[s.authorRole, { color: colors.textMuted }]}>
                  {profile?.role || (language === 'ar' ? 'عضو' : 'Member')}
                </Text>
              </View>
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder={language === 'ar' ? 'شارك رأيك، تحليلاً، أو سؤالاً مهنياً...' : 'Share an insight, analysis, or professional question...'}
              placeholderTextColor={colors.textMuted}
              style={[s.contentInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
              multiline
              autoFocus
              testID="create-post-input"
            />

            <View style={s.topicSection}>
              <Text style={[s.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {language === 'ar' ? 'اختر موضوع المنشور' : 'Choose a topic'}
              </Text>
              <View style={s.topicGrid}>
                {topics.map((topic, index) => (
                  <Pressable
                    key={topic}
                    onPress={() => { setSelectedTopic(selectedTopic === index ? null : index); void Haptics.selectionAsync(); }}
                    style={[
                      s.topicPill,
                      {
                        backgroundColor: selectedTopic === index ? colors.accent : (isDark ? colors.bgMuted : colors.bgSecondary),
                      },
                    ]}
                  >
                    <Text style={[
                      s.topicText,
                      { color: selectedTopic === index ? '#FFF' : colors.textSecondary },
                    ]}>{topic}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={s.attachSection}>
              <Text style={[s.sectionLabel, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
                {language === 'ar' ? 'إضافة مرفقات' : 'Add attachments'}
              </Text>
              <View style={[s.attachBtns, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Pressable
                  onPress={handlePickImage}
                  style={({ pressed }) => [s.attachBtn, { backgroundColor: colors.accentLight }, pressed && { opacity: 0.7 }]}
                >
                  <ImageIcon color={colors.accent} size={18} strokeWidth={1.8} />
                  <Text style={[s.attachBtnText, { color: colors.accent }]}>
                    {language === 'ar' ? 'صورة' : 'Image'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handlePickFile}
                  style={({ pressed }) => [s.attachBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }, pressed && { opacity: 0.7 }]}
                >
                  <FileText color={colors.textSecondary} size={18} strokeWidth={1.8} />
                  <Text style={[s.attachBtnText, { color: colors.textSecondary }]}>
                    {language === 'ar' ? 'ملف' : 'File'}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setLinkModalVisible(true)}
                  style={({ pressed }) => [s.attachBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }, pressed && { opacity: 0.7 }]}
                >
                  <Link2 color={colors.textSecondary} size={18} strokeWidth={1.8} />
                  <Text style={[s.attachBtnText, { color: colors.textSecondary }]}>
                    {language === 'ar' ? 'رابط' : 'Link'}
                  </Text>
                </Pressable>
              </View>

              {imageAttachments.length > 0 && (
                <View style={s.imagePreviewGrid}>
                  {imageAttachments.map((att, idx) => {
                    const globalIdx = attachments.indexOf(att);
                    return (
                      <View key={`img-preview-${idx}`} style={[s.imagePreviewWrap, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]}>
                        <Image source={{ uri: att.url }} style={s.imagePreview} resizeMode="cover" />
                        <Pressable
                          onPress={() => handleRemoveAttachment(globalIdx)}
                          style={s.imageRemoveBtn}
                          hitSlop={8}
                        >
                          <X color="#FFF" size={12} strokeWidth={2.5} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {fileAttachments.length > 0 && (
                <View style={s.attachList}>
                  {fileAttachments.map((att, idx) => {
                    const globalIdx = attachments.indexOf(att);
                    return (
                      <View key={`file-${idx}`} style={[s.attachItem, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary, borderColor: colors.border }]}>
                        <View style={[s.attachIconWrap, { backgroundColor: colors.secondaryLight }]}>
                          <FileText color={colors.secondary} size={14} strokeWidth={1.8} />
                        </View>
                        <Text style={[s.attachItemText, { color: colors.text }]} numberOfLines={1}>{att.name || 'File'}</Text>
                        <Pressable onPress={() => handleRemoveAttachment(globalIdx)} hitSlop={8}>
                          <Trash2 color={colors.error} size={14} strokeWidth={1.8} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}

              {linkAttachments.length > 0 && (
                <View style={s.attachList}>
                  {linkAttachments.map((att, idx) => {
                    const globalIdx = attachments.indexOf(att);
                    return (
                      <View key={`link-${idx}`} style={[s.attachItem, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary, borderColor: colors.border }]}>
                        <View style={[s.attachIconWrap, { backgroundColor: colors.accentLight }]}>
                          <Link2 color={colors.accent} size={14} strokeWidth={1.8} />
                        </View>
                        <Text style={[s.attachItemText, { color: colors.accent }]} numberOfLines={1}>{att.url}</Text>
                        <Pressable onPress={() => handleRemoveAttachment(globalIdx)} hitSlop={8}>
                          <Trash2 color={colors.error} size={14} strokeWidth={1.8} />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[s.toolbar, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: colors.border }]}>
            <Text style={[s.attachCount, { color: colors.textMuted }]}>
              {attachments.length > 0 ? `${attachments.length} ${language === 'ar' ? 'مرفق' : 'attachment(s)'}` : ''}
            </Text>
            <Text style={[s.charCount, { color: colors.textMuted }]}>{content.length}</Text>
          </View>
        </KeyboardAvoidingView>

        <Modal visible={linkModalVisible} transparent animationType="fade" statusBarTranslucent>
          <View style={s.modalOverlay}>
            <View style={[s.modalContainer, { backgroundColor: isDark ? colors.bgCard : colors.white }]}>
              <Text style={[s.modalTitle, { color: colors.text }]}>
                {language === 'ar' ? 'إضافة رابط' : 'Add Link'}
              </Text>
              <TextInput
                value={linkUrl}
                onChangeText={setLinkUrl}
                placeholder="https://example.com"
                placeholderTextColor={colors.textMuted}
                style={[s.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]}
                autoCapitalize="none"
                keyboardType="url"
                autoFocus
              />
              <View style={s.modalActions}>
                <Pressable
                  onPress={() => { setLinkModalVisible(false); setLinkUrl(''); }}
                  style={[s.modalCancelBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]}
                >
                  <Text style={[s.modalCancelText, { color: colors.text }]}>{language === 'ar' ? 'إلغاء' : 'Cancel'}</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddLink}
                  style={[s.modalConfirmBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={s.modalConfirmText}>{language === 'ar' ? 'إضافة' : 'Add'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700' as const },
  publishBtn: {
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12, minWidth: 72, alignItems: 'center',
  },
  publishText: { fontSize: 14, fontWeight: '700' as const },
  scrollContent: { padding: 20, gap: 20 },
  authorRow: { alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  authorInfo: { gap: 2 },
  authorName: { fontSize: 15, fontWeight: '700' as const },
  authorRole: { fontSize: 12 },
  contentInput: { fontSize: 17, lineHeight: 28, minHeight: 120, textAlignVertical: 'top' as const },
  topicSection: { gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '600' as const },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12 },
  topicText: { fontSize: 13, fontWeight: '600' as const },
  attachSection: { gap: 12 },
  attachBtns: { gap: 10 },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  attachBtnText: { fontSize: 13, fontWeight: '600' as const },
  imagePreviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  imagePreviewWrap: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden', position: 'relative' as const },
  imagePreview: { width: '100%', height: '100%' },
  imageRemoveBtn: {
    position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  attachList: { gap: 8 },
  attachItem: {
    alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  attachIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  attachItemText: { flex: 1, fontSize: 13, fontWeight: '500' as const },
  toolbar: {
    alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
  },
  attachCount: { fontSize: 12, fontWeight: '500' as const },
  charCount: { fontSize: 13, fontWeight: '500' as const },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 32 },
  modalContainer: { width: '100%', borderRadius: 18, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' as const, textAlign: 'center' as const },
  modalInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  modalCancelText: { fontSize: 15, fontWeight: '600' as const },
  modalConfirmBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12 },
  modalConfirmText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const },
});
