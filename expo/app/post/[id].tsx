// Muwassa Business Hub — id screen
import React, { useMemo, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ExternalLink,
  FileText,
  Heart,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  Send,
  Share2,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { EnrichedComment, PostAttachment } from '@/types/post';

import { getAvatarColor } from '@/constants/theme';

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CommentItem({ comment }: { comment: EnrichedComment }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { isRTL, language } = useLanguage();
  const avatarColor = getAvatarColor(comment.authorId);

  return (
    <View style={styles.commentWrap}>
      <View style={[styles.commentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.commentAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.commentAvatarText}>{comment.authorInitial}</Text>
        </View>
        <View style={[styles.commentBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[styles.commentHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.commentAuthor}>{comment.authorName}</Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
          </View>
          {comment.authorRole ? (
            <Text style={[styles.commentRole, { textAlign: isRTL ? 'right' : 'left' }]}>
              {comment.authorRole}
            </Text>
          ) : null}
          <Text style={[styles.commentContent, { textAlign: isRTL ? 'right' : 'left' }]}>
            {comment.content}
          </Text>
          <View style={[styles.commentActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable style={[styles.commentAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Heart color={colors.textMuted} size={14} />
              <Text style={styles.commentActionText}>{language === 'ar' ? 'إعجاب' : 'Like'}</Text>
            </Pressable>
            <Pressable style={[styles.commentAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MessageCircle color={colors.textMuted} size={14} />
              <Text style={styles.commentActionText}>{language === 'ar' ? 'رد' : 'Reply'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function renderAttachments(attachments: PostAttachment[], colors: any, isRTL: boolean, c: any) {
  if (!attachments || attachments.length === 0) return null;
  const images = attachments.filter(a => a.type === 'image');
  const files = attachments.filter(a => a.type === 'file');
  const links = attachments.filter(a => a.type === 'link');

  return (
    <View style={{ gap: 8, paddingTop: 4 }}>
      {images.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderRadius: 12, overflow: 'hidden' }}>
          {images.slice(0, 4).map((att, idx) => (
            <View key={`img-${idx}`} style={[
              { overflow: 'hidden', backgroundColor: c.bgMuted },
              images.length === 1 ? { width: '100%', height: 220, borderRadius: 12 } : { width: '48%', height: 150 },
            ]}>
              <Image source={{ uri: att.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          ))}
        </View>
      )}
      {files.map((att, idx) => (
        <View key={`file-${idx}`} style={[
          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted },
        ]}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accentBlueLight || c.accentLight, alignItems: 'center', justifyContent: 'center' }}>
            <FileText color={c.accentBlue || c.accent} size={16} strokeWidth={1.8} />
          </View>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '500' as const, color: c.text }} numberOfLines={1}>{att.name || 'File'}</Text>
        </View>
      ))}
      {links.map((att, idx) => (
        <Pressable key={`link-${idx}`} onPress={() => { void Linking.openURL(att.url).catch(() => {}); }} style={[
          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.bgMuted },
        ]}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: c.accentLight, alignItems: 'center', justifyContent: 'center' }}>
            <Link2 color={c.accent} size={16} strokeWidth={1.8} />
          </View>
          <Text style={{ flex: 1, fontSize: 13, fontWeight: '500' as const, color: c.accent }} numberOfLines={1}>{att.name || att.url}</Text>
          <ExternalLink color={c.textMuted} size={12} strokeWidth={1.5} />
        </Pressable>
      ))}
    </View>
  );
}

export default function PostDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated, profile } = useAuth();
  const [replyText, setReplyText] = useState('');
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const postQuery = useQuery({
    queryKey: ['posts', 'detail', id],
    queryFn: async () => {
      console.log('[PostDetail] fetching post', id);
      return trpcClient.posts.byId.query({ id: id ?? '' });
    },
    enabled: !!id,
  });

  const commentsQuery = useQuery({
    queryKey: ['posts', 'comments', id],
    queryFn: async () => {
      console.log('[PostDetail] fetching comments for', id);
      return trpcClient.posts.comments.query({ postId: id ?? '' });
    },
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      return trpcClient.posts.toggleLike.mutate({ postId: id ?? '' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      return trpcClient.posts.toggleSave.mutate({ postId: id ?? '' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log('[PostDetail] adding comment on', id);
      return trpcClient.posts.addComment.mutate({ postId: id ?? '', content });
    },
    onSuccess: () => {
      setReplyText('');
      void queryClient.invalidateQueries({ queryKey: ['posts', 'comments', id] });
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (err) => {
      console.log('[PostDetail] comment error:', err.message);
      Alert.alert(
        language === 'ar' ? 'خطأ' : 'Error',
        language === 'ar' ? 'فشل إضافة التعليق' : 'Failed to add comment',
      );
    },
  });

  const handleLike = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true, damping: 10, stiffness: 300 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 300 }),
    ]).start();
    likeMutation.mutate();
  }, [isAuthenticated, likeMutation, router, scaleAnim]);

  const handleSave = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    saveMutation.mutate();
  }, [isAuthenticated, saveMutation, router]);

  const handleSendComment = useCallback(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!replyText.trim()) return;
    commentMutation.mutate(replyText.trim());
  }, [isAuthenticated, replyText, commentMutation, router]);

  const post = postQuery.data;
  const comments = commentsQuery.data ?? [];

  if (postQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="post-back">
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <Text style={styles.navTitle}>{language === 'ar' ? 'المنشور' : 'Post'}</Text>
            <View style={{ width: 38 }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="post-back">
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <Text style={styles.navTitle}>{language === 'ar' ? 'المنشور' : 'Post'}</Text>
            <View style={{ width: 38 }} />
          </View>
          <Text style={styles.errorText}>{language === 'ar' ? 'المنشور غير موجود' : 'Post not found'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  const avatarColor = getAvatarColor(post.authorId);
  const timeAgo = formatTimeAgo(post.createdAt);

  const renderHeader = () => (
    <View style={styles.postWrap}>
      <View style={[styles.postHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={() => router.push(`/user/${post.authorId}`)} style={[styles.postAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.postAvatarText}>{post.authorInitial}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/user/${post.authorId}`)} style={[styles.postAuthorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.postAuthorName}>{post.authorName}</Text>
          <Text style={styles.postAuthorRole}>
            {post.authorRole ? `${post.authorRole} · ` : ''}{post.authorCompany}
          </Text>
        </Pressable>
        <Text style={styles.postTime}>{timeAgo}</Text>
      </View>

      {post.topic ? (
        <View style={[styles.topicRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={styles.topicBadge}>
            <Text style={styles.topicText}>{post.topic}</Text>
          </View>
        </View>
      ) : null}

      <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left' }]}>
        {post.content}
      </Text>

      {renderAttachments(post.attachments ?? [], colors, isRTL, c)}

      <View style={styles.divider} />

      <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.statText}>
          {post.likesCount} {language === 'ar' ? 'إعجاب' : 'likes'}
        </Text>
        <Text style={styles.statText}>
          {comments.length} {language === 'ar' ? 'تعليق' : 'comments'}
        </Text>
        <Text style={styles.statText}>
          {post.savesCount} {language === 'ar' ? 'حفظ' : 'saves'}
        </Text>
      </View>

      <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={handleLike} style={[styles.actionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} testID="post-like">
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart color={post.isLiked ? colors.error : colors.textMuted} fill={post.isLiked ? colors.error : 'transparent'} size={20} />
          </Animated.View>
          <Text style={[styles.actionText, post.isLiked && { color: colors.error }]}>
            {language === 'ar' ? 'إعجاب' : 'Like'}
          </Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MessageCircle color={colors.textMuted} size={20} />
          <Text style={styles.actionText}>{language === 'ar' ? 'تعليق' : 'Comment'}</Text>
        </Pressable>
        <Pressable onPress={handleSave} style={[styles.actionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} testID="post-save">
          <Bookmark color={post.isSaved ? colors.accent : colors.textMuted} fill={post.isSaved ? colors.accent : 'transparent'} size={20} />
          <Text style={[styles.actionText, post.isSaved && { color: colors.accent }]}>
            {language === 'ar' ? 'حفظ' : 'Save'}
          </Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Share2 color={colors.textMuted} size={20} />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <Text style={[styles.commentsTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? `التعليقات (${comments.length})` : `Comments (${comments.length})`}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="post-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <Text style={styles.navTitle}>{language === 'ar' ? 'المنشور' : 'Post'}</Text>
          <View style={{ width: 38 }} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <CommentItem comment={item} />}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="post-comments"
          />

          <View style={[styles.replyBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.replyAvatarSmall}>
              <Text style={styles.replyAvatarText}>
                {(profile?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder={language === 'ar' ? 'اكتب تعليقاً...' : 'Write a comment...'}
              placeholderTextColor={colors.textMuted}
              style={[styles.replyInput, { textAlign: isRTL ? 'right' : 'left' }]}
              testID="reply-input"
            />
            <Pressable
              style={[styles.sendBtn, (!replyText.trim() || commentMutation.isPending) && styles.sendBtnDisabled]}
              disabled={!replyText.trim() || commentMutation.isPending}
              onPress={handleSendComment}
              testID="send-reply"
            >
              {commentMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Send color={replyText.trim() ? colors.white : colors.textMuted} size={16} />
              )}
            </Pressable>
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
    backgroundColor: c.bg,
  },
  safe: {
    flex: 1,
  },
  navBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    backgroundColor: c.bgCard,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.bgMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
  },
  listContent: {
    paddingBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  postWrap: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  postHeader: {
    alignItems: 'center',
    gap: 12,
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: c.white,
    fontSize: 18,
    fontWeight: '700' as const,
  },
  postAuthorInfo: {
    flex: 1,
    gap: 3,
  },
  postAuthorName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: c.text,
  },
  postAuthorRole: {
    fontSize: 13,
    color: c.textMuted,
  },
  postTime: {
    fontSize: 12,
    color: c.textMuted,
  },
  topicRow: {
    paddingTop: 4,
  },
  topicBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  topicText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.accent,
  },
  postContent: {
    fontSize: 16,
    lineHeight: 26,
    color: c.text,
    paddingTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: c.divider,
    marginVertical: 4,
  },
  statsRow: {
    gap: 20,
    paddingVertical: 2,
  },
  statText: {
    fontSize: 13,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  actionsRow: {
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: c.textMuted,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
    paddingTop: 4,
    paddingBottom: 4,
  },
  commentWrap: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  commentRow: {
    gap: 10,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  commentBody: {
    flex: 1,
    gap: 4,
  },
  commentHeader: {
    alignItems: 'center',
    gap: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.text,
  },
  commentTime: {
    fontSize: 12,
    color: c.textMuted,
  },
  commentRole: {
    fontSize: 12,
    color: c.textSecondary,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 22,
    color: c.text,
    paddingTop: 2,
  },
  commentActions: {
    gap: 16,
    paddingTop: 6,
  },
  commentAction: {
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.textMuted,
  },
  replyBar: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.divider,
    backgroundColor: c.bgCard,
  },
  replyAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatarText: {
    color: c.white,
    fontSize: 13,
    fontWeight: '700' as const,
  },
  replyInput: {
    flex: 1,
    fontSize: 14,
    color: c.text,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    backgroundColor: c.bgMuted,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: c.bgMuted,
  },
});
