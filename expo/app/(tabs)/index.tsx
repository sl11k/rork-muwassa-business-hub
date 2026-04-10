import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
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
  Heart,
  MessageCircle,
  Pen,
  Plus,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

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

const AVATAR_COLORS = ['#0D9488', '#4A9FF5', '#2DD4BF', '#FB7185', '#818CF8', '#F472B6', '#22D3EE', '#FBBF24'];

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

function AppHeader() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[hs.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[hs.logoText, { color: colors.text }]}>
        {language === 'ar' ? 'مُوسع' : 'Muwassa'}
      </Text>
      <View style={[hs.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable
          style={({ pressed }) => [hs.headerIconBtn, { backgroundColor: colors.bgCard }, pressed && { opacity: 0.7 }]}
          testID="search-btn"
          onPress={() => router.push('/explore')}
        >
          <Search color={colors.textSecondary} size={18} strokeWidth={1.5} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [hs.headerIconBtn, { backgroundColor: colors.bgCard }, pressed && { opacity: 0.7 }]}
          testID="notifications-btn"
          onPress={() => router.push('/notifications')}
        >
          <Bell color={colors.textSecondary} size={18} strokeWidth={1.5} />
          <View style={[hs.notifDot, { backgroundColor: colors.accent, borderColor: colors.bg }]} />
        </Pressable>
      </View>
    </View>
  );
}

const hs = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10, height: 48 },
  logoText: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  headerActions: { alignItems: 'center', gap: 8 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: 3.5, borderWidth: 2 },
});

function SectionTabs({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const tabs = language === 'ar' ? SECTION_TABS_AR : SECTION_TABS_EN;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeTab,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [activeTab, indicatorAnim]);

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
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={() => router.push('/create-post')}
      style={[
        cb.bar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: colors.bgCard,
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
        <Pen color={colors.accent} size={14} strokeWidth={1.5} />
      </View>
    </PressableScale>
  );
}

const cb = StyleSheet.create({
  bar: { alignItems: 'center', gap: 12, marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 13, fontWeight: '700' as const },
  placeholder: { flex: 1, fontSize: 14, opacity: 0.7 },
  btn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});

function CategoryTabs({ activeCategory, onSelect, extraCategories }: { activeCategory: string; onSelect: (cat: string) => void; extraCategories: string[] }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
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
                    backgroundColor: colors.bgCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                  },
              pressed && { transform: [{ scale: 0.93 }] },
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
  pill: { paddingHorizontal: 14, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 13, fontWeight: '500' as const },
});

function TrendingBar() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={tb.wrap}>
      <View style={[tb.header, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
        <TrendingUp color={colors.accent} size={14} strokeWidth={2} />
        <Text style={[tb.title, { color: colors.accent }]}>
          {language === 'ar' ? 'رائج الآن' : 'Trending'}
        </Text>
      </View>
      <FlatList
        horizontal
        inverted={isRTL}
        data={trendingTopics.slice(0, 4)}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
        renderItem={({ item }) => (
          <View style={[tb.chip, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[tb.chipText, { color: colors.textSecondary }]}>
              {getLocalizedText(item.label, language)}
            </Text>
            {item.isHot && <View style={[tb.hotDot, { backgroundColor: colors.error }]} />}
          </View>
        )}
      />
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: { paddingBottom: 10, gap: 6 },
  header: { alignItems: 'center', gap: 5, marginBottom: 2 },
  title: { fontSize: 12, fontWeight: '600' as const },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chipText: { fontSize: 12, fontWeight: '500' as const },
  hotDot: { width: 5, height: 5, borderRadius: 2.5 },
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
  const { colors } = useTheme();
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

  return (
    <Animated.View style={[
      fc.card,
      {
        transform: [{ scale: scaleAnim }, { translateY: slideIn }],
        opacity: fadeIn,
        backgroundColor: colors.bgCard,
        borderColor: colors.border,
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
                  strokeWidth={1.5}
                />
              </Animated.View>
              <Text style={[fc.actionText, { color: colors.textMuted }, post.isLiked && { color: colors.error }]}>
                {post.likesCount}
              </Text>
            </Pressable>
            <Pressable onPress={onPress} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`comment-${post.id}`}>
              <MessageCircle color={colors.textMuted} size={18} strokeWidth={1.5} />
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
                  strokeWidth={1.5}
                />
              </Animated.View>
            </Pressable>
            <Pressable style={({ pressed }) => [fc.action, pressed && fc.pressed]}>
              <Share2 color={colors.textMuted} size={16} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const fc = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  header: { alignItems: 'center', gap: 10, padding: 14, paddingBottom: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  authorInfo: { flex: 1, gap: 1 },
  authorName: { fontSize: 14, fontWeight: '600' as const },
  authorRole: { fontSize: 12 },
  time: { fontSize: 12 },
  content: { paddingHorizontal: 14, paddingBottom: 10, fontSize: 14, lineHeight: 21 },
  topicRow: { paddingHorizontal: 14, paddingBottom: 10 },
  topicBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  topicText: { fontSize: 11, fontWeight: '600' as const },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1 },
  actionsLeft: { gap: 16 },
  actionsRight: { gap: 14 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 13 },
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
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '600' as const },
  desc: { fontSize: 13, textAlign: 'center' as const },
  btn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '600' as const },
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
    void feedQuery.refetch().then(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });
  }, [feedQuery]);

  const handleEndReached = useCallback(() => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      console.log('[HomeScreen] loading next page');
      void feedQuery.fetchNextPage();
    }
  }, [feedQuery]);

  const handleAuthorPress = useCallback((authorId: string) => {
    router.push(`/user/${authorId}`);
  }, [router]);

  const listHeader = useMemo(() => (
    <>
      <AppHeader />
      <SectionTabs activeTab={activeSectionTab} onSelect={setActiveSectionTab} />
      <ComposeBar />
      <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} extraCategories={communityCategories} />
      <TrendingBar />
    </>
  ), [activeCategory, communityCategories, activeSectionTab]);

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

  const listFooter = useMemo(() => {
    if (feedQuery.isFetchingNextPage) {
      return (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      );
    }
    return null;
  }, [feedQuery.isFetchingNextPage, colors]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {feedQuery.isLoading ? (
          <>
            <AppHeader />
            <LoadingSkeleton />
          </>
        ) : (
          <FlatList
            data={allPosts}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={<EmptyFeed />}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="home-feed"
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={feedQuery.isRefetching && !feedQuery.isFetchingNextPage}
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
  listContent: { paddingBottom: 100 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
