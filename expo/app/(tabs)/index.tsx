import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Bookmark,
  BookOpen,
  Heart,
  Image as ImageIcon,
  Link2,
  FileText,
  MessageCircle,
  Pen,
  Plus,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
  Shield,
  Megaphone,
  ExternalLink,
} from 'lucide-react-native';
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { FeedCardSkeleton } from '@/components/SkeletonLoader';
import {
  getLocalizedText,
  trendingTopics,
} from '@/data/businessHub';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import type { EnrichedPost } from '@/types/post';

const AVATAR_COLORS = ['#0F8B8D', '#1D4ED8', '#14B8A6', '#EF4444', '#6366F1', '#EC4899', '#0891B2', '#F59E0B'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const SECTION_TABS_AR = ['لك', 'أتابعه', 'مركز المعرفة'];
const SECTION_TABS_EN = ['For you', 'Following', 'Knowledge'];
const BASE_CATEGORIES_AR = ['الكل', 'الحوكمة', 'الفرص', 'تحليلات'];
const BASE_CATEGORIES_EN = ['All', 'Governance', 'Opportunities', 'Insights'];

const KNOWLEDGE_TABS_AR = ['معرفة عامة', 'الحوكمة والامتثال'];
const KNOWLEDGE_TABS_EN = ['General', 'Governance & Compliance'];

function AppHeader() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={[hs.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[hs.logoText, { color: colors.text }]}>
        {language === 'ar' ? 'مُوسع' : 'Muwassa'}
      </Text>
      <Pressable
        style={({ pressed }) => [
          hs.headerIconBtn,
          { backgroundColor: isDark ? colors.bgCard : colors.bgMuted },
          pressed && { opacity: 0.7 },
        ]}
        testID="notifications-btn"
        onPress={() => router.push('/notifications')}
      >
        <Bell color={colors.textSecondary} size={18} strokeWidth={1.8} />
        <View style={[hs.notifDot, { backgroundColor: colors.accent, borderColor: colors.bg }]} />
      </Pressable>
    </View>
  );
}

const hs = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, height: 48 },
  logoText: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.5 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 3.5, borderWidth: 2 },
});

function SectionTabs({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const tabs = language === 'ar' ? SECTION_TABS_AR : SECTION_TABS_EN;

  return (
    <View style={[st.container, { borderBottomColor: colors.border }]}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab}
          onPress={() => { onSelect(index); void Haptics.selectionAsync(); }}
          style={st.tabItem}
        >
          <Text style={[
            st.tabText,
            { color: activeTab === index ? colors.accent : colors.textMuted },
          ]}>{tab}</Text>
          {activeTab === index && (
            <View style={[st.tabIndicator, { backgroundColor: colors.accent }]} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flexDirection: 'row', borderBottomWidth: 1 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative' as const },
  tabText: { fontSize: 14, fontWeight: '600' as const },
  tabIndicator: { position: 'absolute', bottom: -1, width: '50%', height: 2, borderRadius: 1 },
});

function ComposeBar() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <PressableScale
      onPress={() => router.push('/create-post')}
      style={[
        cb.bar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: isDark ? colors.bgCard : colors.bgMuted,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}
      haptic
      testID="compose-post"
    >
      <View style={[cb.avatar, { backgroundColor: colors.accent }]}>
        <Text style={cb.avatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={[cb.placeholder, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
        {language === 'ar' ? 'ماذا يدور في ذهنك؟' : "What's on your mind?"}
      </Text>
      <View style={[cb.btn, { backgroundColor: colors.accentLight }]}>
        <Pen color={colors.accent} size={14} strokeWidth={1.8} />
      </View>
    </PressableScale>
  );
}

const cb = StyleSheet.create({
  bar: { alignItems: 'center', gap: 12, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  avatar: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 13, fontWeight: '700' as const },
  placeholder: { flex: 1, fontSize: 14, opacity: 0.7 },
  btn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});

function CategoryTabs({ activeCategory, onSelect, extraCategories }: { activeCategory: string; onSelect: (cat: string) => void; extraCategories: string[] }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const categories = language === 'ar' ? [...BASE_CATEGORIES_AR, ...extraCategories] : [...BASE_CATEGORIES_EN, ...extraCategories];

  const firstCat = categories[0];
  const handleSelect = useCallback((item: string) => {
    onSelect(item === firstCat ? '' : item);
    void Haptics.selectionAsync();
  }, [firstCat, onSelect]);

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={categories}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={ct.row}
      renderItem={({ item }) => {
        const isActive = activeCategory === item || (activeCategory === '' && item === categories[0]);
        return (
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [
              ct.pill,
              isActive
                ? { backgroundColor: colors.accent }
                : {
                    backgroundColor: isDark ? colors.bgCard : colors.bgMuted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
          >
            <Text style={[
              ct.text,
              { color: isActive ? '#FFF' : colors.textMuted },
              isActive && { fontWeight: '600' as const },
            ]}>{item}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const ct = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  pill: { paddingHorizontal: 16, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '500' as const },
});

const FeedCard = React.memo(function FeedCard({
  post,
  onPress,
  onLike,
  onSave,
  onAuthorPress,
  isFirst,
}: {
  post: EnrichedPost;
  onPress: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAuthorPress: (authorId: string) => void;
  isFirst?: boolean;
}) {
  const { isRTL } = useLanguage();
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 160 }),
    ]).start();
  }, [fadeIn, slideIn]);

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true, damping: 18, stiffness: 240 }).start();
  }, [scaleAnim]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 200 }).start();
  }, [scaleAnim]);

  const handleLike = useCallback(() => {
    onLike(post.id);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.4, useNativeDriver: true, damping: 5, stiffness: 400 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 280 }),
    ]).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [heartScale, post.id, onLike]);

  const handleSave = useCallback(() => {
    onSave(post.id);
    Animated.sequence([
      Animated.spring(bookmarkScale, { toValue: 1.35, useNativeDriver: true, damping: 5, stiffness: 400 }),
      Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 280 }),
    ]).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [bookmarkScale, post.id, onSave]);

  const avatarColor = getAvatarColor(post.authorId);
  const timeAgo = formatTimeAgo(post.createdAt);
  const attachments = post.attachments ?? [];
  const imageAttachments = attachments.filter(a => a.type === 'image');
  const fileAttachments = attachments.filter(a => a.type === 'file');
  const linkAttachments = attachments.filter(a => a.type === 'link');

  return (
    <Animated.View style={[
      fc.card,
      {
        transform: [{ scale: scaleAnim }, { translateY: slideIn }],
        opacity: fadeIn,
        backgroundColor: isDark ? colors.bgCard : colors.white,
        borderColor: colors.border,
        shadowColor: colors.cardShadow,
        shadowOpacity: 1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      },
      isFirst && { borderLeftColor: colors.accent, borderLeftWidth: 3 },
    ]}>
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} testID={`feed-${post.id}`}>
        <View style={[fc.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => onAuthorPress(post.authorId)}>
            <View style={[fc.avatar, { backgroundColor: avatarColor }]}>
              <Text style={fc.avatarText}>{post.authorInitial}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => onAuthorPress(post.authorId)} style={[fc.authorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[fc.authorName, { color: colors.text }]}>{post.authorName}</Text>
            <Text style={[fc.authorRole, { color: colors.textSecondary }]} numberOfLines={1}>
              {post.authorRole ? `${post.authorRole}` : ''}{post.authorCompany ? ` · ${post.authorCompany}` : ''}
            </Text>
          </Pressable>
          <Text style={[fc.time, { color: colors.textMuted }]}>{timeAgo}</Text>
        </View>

        <Text style={[fc.content, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={4}>
          {post.content}
        </Text>

        {imageAttachments.length > 0 && (
          <View style={fc.imageGrid}>
            {imageAttachments.slice(0, 4).map((att, idx) => (
              <View key={`img-${idx}`} style={[
                fc.imageWrap,
                imageAttachments.length === 1 && fc.imageSingle,
                imageAttachments.length > 1 && fc.imageMulti,
                { backgroundColor: colors.bgMuted },
              ]}>
                <Image
                  source={{ uri: att.url }}
                  style={fc.imageItem}
                  resizeMode="cover"
                />
                {idx === 3 && imageAttachments.length > 4 && (
                  <View style={fc.imageOverlay}>
                    <Text style={fc.imageOverlayText}>+{imageAttachments.length - 4}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {fileAttachments.length > 0 && (
          <View style={fc.attachmentsWrap}>
            {fileAttachments.map((att, idx) => (
              <View key={`file-${idx}`} style={[fc.attachmentItem, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary, borderColor: colors.border }]}>
                <View style={[fc.attachmentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[fc.fileIconWrap, { backgroundColor: colors.accentBlueLight }]}>
                    <FileText color={colors.accentBlue} size={14} strokeWidth={1.8} />
                  </View>
                  <Text style={[fc.attachmentText, { color: colors.text }]} numberOfLines={1}>{att.name || 'File'}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {linkAttachments.length > 0 && (
          <View style={fc.attachmentsWrap}>
            {linkAttachments.map((att, idx) => (
              <Pressable
                key={`link-${idx}`}
                onPress={() => { void Linking.openURL(att.url).catch(() => {}); }}
                style={[fc.linkCard, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary, borderColor: colors.border }]}
              >
                <View style={[fc.attachmentRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[fc.linkIconWrap, { backgroundColor: colors.accentLight }]}>
                    <Link2 color={colors.accent} size={14} strokeWidth={1.8} />
                  </View>
                  <Text style={[fc.linkText, { color: colors.accent }]} numberOfLines={1}>{att.name || att.url}</Text>
                  <ExternalLink color={colors.textMuted} size={12} strokeWidth={1.5} />
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {post.topic ? (
          <View style={[fc.topicRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[fc.topicBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[fc.topicText, { color: colors.accent }]}>#{post.topic}</Text>
            </View>
          </View>
        ) : null}

        <View style={[fc.actionsRow, { borderTopColor: colors.border }]}>
          <View style={[fc.actionsLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={handleLike} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`like-${post.id}`}>
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart
                  color={post.isLiked ? colors.error : colors.textMuted}
                  fill={post.isLiked ? colors.error : 'transparent'}
                  size={18}
                  strokeWidth={1.8}
                />
              </Animated.View>
              <Text style={[fc.actionText, { color: colors.textMuted }, post.isLiked && { color: colors.error }]}>
                {post.likesCount}
              </Text>
            </Pressable>
            <Pressable onPress={onPress} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`comment-${post.id}`}>
              <MessageCircle color={colors.textMuted} size={18} strokeWidth={1.8} />
              <Text style={[fc.actionText, { color: colors.textMuted }]}>{post.commentsCount}</Text>
            </Pressable>
          </View>
          <View style={[fc.actionsRight, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={handleSave} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`save-${post.id}`}>
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <Bookmark
                  color={post.isSaved ? colors.accent : colors.textMuted}
                  fill={post.isSaved ? colors.accent : 'transparent'}
                  size={18}
                  strokeWidth={1.8}
                />
              </Animated.View>
            </Pressable>
            <Pressable style={({ pressed }) => [fc.action, pressed && fc.pressed]}>
              <Share2 color={colors.textMuted} size={16} strokeWidth={1.8} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const fc = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  header: { alignItems: 'center', gap: 10, padding: 14, paddingBottom: 6 },
  avatar: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  authorInfo: { flex: 1, gap: 2 },
  authorName: { fontSize: 14, fontWeight: '600' as const },
  authorRole: { fontSize: 12 },
  time: { fontSize: 12 },
  content: { paddingHorizontal: 14, paddingBottom: 10, fontSize: 14, lineHeight: 22 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginHorizontal: 14, marginBottom: 10, borderRadius: 12, overflow: 'hidden' },
  imageWrap: { overflow: 'hidden' },
  imageSingle: { width: '100%', height: 200, borderRadius: 12 },
  imageMulti: { width: '49%', height: 140, borderRadius: 0 },
  imageItem: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  imageOverlayText: { color: '#FFF', fontSize: 18, fontWeight: '700' as const },
  attachmentsWrap: { paddingHorizontal: 14, paddingBottom: 8, gap: 6 },
  attachmentItem: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  attachmentRow: { alignItems: 'center', gap: 10 },
  attachmentText: { fontSize: 13, flex: 1, fontWeight: '500' as const },
  fileIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  linkCard: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1 },
  linkIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 13, flex: 1, fontWeight: '500' as const },
  topicRow: { paddingHorizontal: 14, paddingBottom: 10 },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  topicText: { fontSize: 11, fontWeight: '600' as const },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1 },
  actionsLeft: { gap: 18 },
  actionsRight: { gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13, fontWeight: '500' as const },
  pressed: { opacity: 0.6 },
});

function LoadingSkeleton() {
  return (
    <View style={{ paddingTop: 4 }}>
      <FeedCardSkeleton />
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  );
}

function EmptyFeed() {
  const { language } = useLanguage();
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={ef.wrap}>
      <View style={[ef.iconWrap, { backgroundColor: colors.accentLight }]}>
        <Sparkles color={colors.accent} size={36} strokeWidth={1.5} />
      </View>
      <Text style={[ef.title, { color: colors.text }]}>
        {language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
      </Text>
      <Text style={[ef.desc, { color: colors.textSecondary }]}>
        {language === 'ar' ? 'كن أول من يشارك رأيه' : 'Be the first to share an insight'}
      </Text>
      <Pressable
        onPress={() => router.push('/create-post')}
        style={({ pressed }) => [ef.btn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
      >
        <Text style={ef.btnText}>
          {language === 'ar' ? 'أنشئ منشوراً' : 'Create Post'}
        </Text>
      </Pressable>
    </View>
  );
}

const ef = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40, gap: 8 },
  iconWrap: { width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '600' as const },
  desc: { fontSize: 13, textAlign: 'center' as const },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' as const },
});

function FollowingEmpty() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={ef.wrap}>
      <View style={[ef.iconWrap, { backgroundColor: colors.accentLight }]}>
        <Users color={colors.accent} size={36} strokeWidth={1.5} />
      </View>
      <Text style={[ef.title, { color: colors.text }]}>
        {language === 'ar' ? 'لا توجد منشورات من متابعيك' : 'No posts from people you follow'}
      </Text>
      <Text style={[ef.desc, { color: colors.textSecondary }]}>
        {language === 'ar' ? 'تابع أشخاصاً ومجتمعات لترى منشوراتهم هنا' : 'Follow people and communities to see their posts here'}
      </Text>
      <Pressable
        onPress={() => router.push('/explore')}
        style={({ pressed }) => [ef.btn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
      >
        <Text style={ef.btnText}>
          {language === 'ar' ? 'اكتشف خبراء' : 'Discover Experts'}
        </Text>
      </Pressable>
    </View>
  );
}

function KnowledgeCenter() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [activeKnowledgeTab, setActiveKnowledgeTab] = useState(0);
  const knowledgeTabs = language === 'ar' ? KNOWLEDGE_TABS_AR : KNOWLEDGE_TABS_EN;

  const generalItems = [
    {
      id: 'update-1',
      icon: Megaphone,
      iconColor: colors.accent,
      title: language === 'ar' ? 'تحديث التطبيق v2.0' : 'App Update v2.0',
      desc: language === 'ar' ? 'ميزات جديدة: نظام المتابعة، إنشاء المجتمعات، ومرفقات المنشورات' : 'New features: Follow system, community creation, and post attachments',
      time: language === 'ar' ? 'منذ يوم' : '1d ago',
      isNew: true,
    },
    {
      id: 'update-2',
      icon: TrendingUp,
      iconColor: colors.accentBlue,
      title: language === 'ar' ? 'أبرز اتجاهات الأعمال 2026' : 'Top Business Trends 2026',
      desc: language === 'ar' ? 'تحليل شامل لأهم الاتجاهات في عالم الأعمال والتقنية' : 'Comprehensive analysis of key business and tech trends',
      time: language === 'ar' ? 'منذ 3 أيام' : '3d ago',
      isNew: false,
    },
    {
      id: 'update-3',
      icon: Users,
      iconColor: '#EC4899',
      title: language === 'ar' ? 'نصائح لبناء شبكة مهنية قوية' : 'Tips for Building a Strong Network',
      desc: language === 'ar' ? 'كيف تبني علاقات مهنية مستدامة وفعالة' : 'How to build sustainable and effective professional relationships',
      time: language === 'ar' ? 'منذ أسبوع' : '1w ago',
      isNew: false,
    },
  ];

  const governanceItems = [
    {
      id: 'gov-1',
      icon: Shield,
      iconColor: colors.accent,
      title: language === 'ar' ? 'دليل الامتثال التنظيمي 2026' : 'Regulatory Compliance Guide 2026',
      desc: language === 'ar' ? 'إطار شامل للامتثال التنظيمي في المملكة العربية السعودية' : 'Comprehensive regulatory compliance framework in Saudi Arabia',
      time: language === 'ar' ? 'منذ يومين' : '2d ago',
      isNew: true,
    },
    {
      id: 'gov-2',
      icon: BookOpen,
      iconColor: colors.gold,
      title: language === 'ar' ? 'تحديثات نظام الشركات الجديد' : 'New Companies Law Updates',
      desc: language === 'ar' ? 'أهم التعديلات على نظام الشركات وتأثيرها على حوكمة الشركات' : 'Key amendments to the Companies Law and their impact on governance',
      time: language === 'ar' ? 'منذ 5 أيام' : '5d ago',
      isNew: false,
    },
    {
      id: 'gov-3',
      icon: FileText,
      iconColor: colors.accentBlue,
      title: language === 'ar' ? 'قوالب سياسات مجلس الإدارة' : 'Board Policy Templates',
      desc: language === 'ar' ? 'قوالب جاهزة لسياسات مجلس الإدارة واللجان التابعة له' : 'Ready-made templates for board and committee policies',
      time: language === 'ar' ? 'منذ أسبوعين' : '2w ago',
      isNew: false,
    },
  ];

  const items = activeKnowledgeTab === 0 ? generalItems : governanceItems;

  return (
    <View style={kc.wrap}>
      <View style={[kc.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
        <BookOpen color={colors.accent} size={20} strokeWidth={1.8} />
        <Text style={[kc.headerTitle, { color: colors.text }]}>
          {language === 'ar' ? 'مركز المعرفة' : 'Knowledge Center'}
        </Text>
      </View>
      <Text style={[kc.headerSub, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary, paddingHorizontal: 16 }]}>
        {language === 'ar' ? 'تحديثات التطبيق والمعرفة المهنية' : 'App updates and professional knowledge'}
      </Text>

      <FlatList
        horizontal
        inverted={isRTL}
        data={knowledgeTabs}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingTop: 10, paddingBottom: 6 }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => { setActiveKnowledgeTab(index); void Haptics.selectionAsync(); }}
            style={[
              kc.tabPill,
              activeKnowledgeTab === index
                ? { backgroundColor: colors.accent }
                : { backgroundColor: isDark ? colors.bgCard : colors.bgMuted, borderWidth: 1, borderColor: colors.border },
            ]}
          >
            <Text style={[kc.tabText, { color: activeKnowledgeTab === index ? '#FFF' : colors.textMuted }]}>{item}</Text>
          </Pressable>
        )}
      />

      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push('/knowledge')}
          style={({ pressed }) => [
            kc.card,
            {
              backgroundColor: isDark ? colors.bgCard : colors.white,
              borderColor: colors.border,
              shadowColor: colors.cardShadow,
              shadowOpacity: 1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <View style={[kc.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[kc.cardIcon, { backgroundColor: item.iconColor + '18' }]}>
              <item.icon color={item.iconColor} size={18} strokeWidth={1.8} />
            </View>
            <View style={[kc.cardContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[kc.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
                {item.isNew && (
                  <View style={[kc.newBadge, { backgroundColor: colors.accent }]}>
                    <Text style={kc.newBadgeText}>{language === 'ar' ? 'جديد' : 'NEW'}</Text>
                  </View>
                )}
              </View>
              <Text style={[kc.cardDesc, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]} numberOfLines={2}>{item.desc}</Text>
              <Text style={[kc.cardTime, { color: colors.textMuted }]}>{item.time}</Text>
            </View>
          </View>
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push('/knowledge')}
        style={({ pressed }) => [
          kc.moreBtn,
          { backgroundColor: isDark ? colors.bgCard : colors.white, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <BookOpen color={colors.accent} size={16} strokeWidth={1.8} />
        <Text style={[kc.moreBtnText, { color: colors.accent }]}>
          {language === 'ar' ? 'استعراض جميع المقالات' : 'View all articles'}
        </Text>
      </Pressable>
    </View>
  );
}

const kc = StyleSheet.create({
  wrap: { paddingTop: 16, gap: 8 },
  headerRow: { alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700' as const },
  headerSub: { fontSize: 13 },
  tabPill: { paddingHorizontal: 16, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' as const },
  card: { marginHorizontal: 16, marginTop: 6, borderRadius: 14, borderWidth: 1, padding: 14 },
  cardRow: { gap: 12, alignItems: 'flex-start' },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 14, fontWeight: '600' as const },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  cardTime: { fontSize: 12 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' as const },
  moreBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  moreBtnText: { fontSize: 14, fontWeight: '600' as const },
});

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState(0);
  const [communityCategories, setCommunityCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    (async () => {
      try {
        const data = await trpcClient.users.userCommunities.query({ userId: user.id });
        const names = data.map((c: any) => language === 'ar' ? c.nameAr : c.name);
        setCommunityCategories(names);
      } catch (err) {
        console.log('[HomeScreen] community categories error', err);
      }
    })().catch(() => {});
  }, [isAuthenticated, user, language]);

  const feedQuery = useInfiniteQuery({
    queryKey: ['posts', 'feed'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('[HomeScreen] fetching feed cursor=', pageParam);
      return trpcClient.posts.list.query({ cursor: pageParam as number, limit: 20 });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
  });

  const followingQuery = useInfiniteQuery({
    queryKey: ['posts', 'following'],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('[HomeScreen] fetching following feed cursor=', pageParam);
      return trpcClient.posts.followingFeed.query({ cursor: pageParam as number, limit: 20 });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    enabled: isAuthenticated && activeSectionTab === 1,
  });

  const allPosts = useMemo(() => {
    const raw = feedQuery.data?.pages.flatMap((p) => p.posts) ?? [];
    if (!activeCategory) return raw;
    return raw.filter((post) => {
      const topic = (post.topic ?? '').toLowerCase();
      const cat = activeCategory.toLowerCase();
      if (cat === 'governance' || cat === 'الحوكمة') {
        return topic.includes('governance') || topic.includes('حوكمة') || topic.includes('compliance') || topic.includes('امتثال');
      }
      if (cat === 'opportunities' || cat === 'الفرص') {
        return topic.includes('opportunit') || topic.includes('فرص') || topic.includes('invest') || topic.includes('استثمار');
      }
      if (cat === 'insights' || cat === 'تحليلات') {
        return topic.includes('insight') || topic.includes('تحليل') || topic.includes('analytics') || topic.includes('strategy');
      }
      return topic.includes(cat) || (post.authorCompany ?? '').toLowerCase().includes(cat);
    });
  }, [feedQuery.data, activeCategory]);

  const followingPosts = useMemo(() => {
    return followingQuery.data?.pages.flatMap((p) => p.posts) ?? [];
  }, [followingQuery.data]);

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.posts.toggleLike.mutate({ postId }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['posts'] }); },
    onError: (err) => { console.log('[HomeScreen] like error', err.message); },
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => trpcClient.posts.toggleSave.mutate({ postId }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (data.saved) {
        setToastMsg(language === 'ar' ? 'تم الحفظ' : 'Saved');
        setToastVisible(true);
      }
    },
    onError: (err) => { console.log('[HomeScreen] save error', err.message); },
  });

  const handleLike = useCallback((postId: string) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    likeMutation.mutate(postId);
  }, [isAuthenticated, likeMutation, router]);

  const handleSave = useCallback((postId: string) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    saveMutation.mutate(postId);
  }, [isAuthenticated, saveMutation, router]);

  const handleRefresh = useCallback(() => {
    console.log('[HomeScreen] pull-to-refresh');
    if (activeSectionTab === 1) {
      void followingQuery.refetch().then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    } else {
      void feedQuery.refetch().then(() => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      });
    }
  }, [feedQuery, followingQuery, activeSectionTab]);

  const handleEndReached = useCallback(() => {
    if (activeSectionTab === 1) {
      if (followingQuery.hasNextPage && !followingQuery.isFetchingNextPage) {
        void followingQuery.fetchNextPage();
      }
    } else {
      if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
        void feedQuery.fetchNextPage();
      }
    }
  }, [feedQuery, followingQuery, activeSectionTab]);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push(`/user/${authorId}`);
  }, [router]);

  const renderItem = useCallback(({ item, index }: { item: EnrichedPost; index: number }) => (
    <FeedCard
      post={item}
      onPress={() => router.push(`/post/${item.id}`)}
      onLike={handleLike}
      onSave={handleSave}
      onAuthorPress={handleAuthorPress}
      isFirst={index === 0}
    />
  ), [router, handleLike, handleSave, handleAuthorPress]);

  const currentPosts = activeSectionTab === 1 ? followingPosts : allPosts;
  const isLoading = activeSectionTab === 1 ? followingQuery.isLoading : feedQuery.isLoading;
  const isFetchingNext = activeSectionTab === 1 ? followingQuery.isFetchingNextPage : feedQuery.isFetchingNextPage;
  const isRefetching = activeSectionTab === 1
    ? (followingQuery.isRefetching && !followingQuery.isFetchingNextPage)
    : (feedQuery.isRefetching && !feedQuery.isFetchingNextPage);

  const listHeader = useMemo(() => (
    <>
      <AppHeader />
      <SectionTabs activeTab={activeSectionTab} onSelect={setActiveSectionTab} />
      {activeSectionTab === 2 ? null : <ComposeBar />}
      {activeSectionTab === 0 && (
        <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} extraCategories={communityCategories} />
      )}
    </>
  ), [activeCategory, communityCategories, activeSectionTab]);

  const listFooter = useMemo(() => {
    if (isFetchingNext) {
      return (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    return null;
  }, [isFetchingNext, colors]);

  if (activeSectionTab === 2) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <FlatList
            data={[]}
            keyExtractor={() => 'knowledge'}
            renderItem={null}
            ListHeaderComponent={
              <>
                <AppHeader />
                <SectionTabs activeTab={activeSectionTab} onSelect={setActiveSectionTab} />
                <KnowledgeCenter />
              </>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {isLoading ? (
          <>
            <AppHeader />
            <LoadingSkeleton />
          </>
        ) : (
          <FlatList
            data={currentPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={activeSectionTab === 1 ? <FollowingEmpty /> : <EmptyFeed />}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="home-feed"
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
          />
        )}

        <Pressable
          onPress={() => { router.push('/create-post'); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: colors.accent },
            pressed && { opacity: 0.9, transform: [{ scale: 0.9 }] },
          ]}
          testID="fab-create"
        >
          <Plus color="#FFF" size={24} strokeWidth={2.5} />
        </Pressable>

        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 120 },
  fab: {
    position: 'absolute',
    bottom: 106,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
