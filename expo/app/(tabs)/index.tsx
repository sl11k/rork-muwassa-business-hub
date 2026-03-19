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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Bookmark,
  ChevronRight,
  Flame,
  Heart,
  MessageCircle,
  PenLine,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react-native';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { LanguageToggle } from '@/components/LanguageToggle';
import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { FeedCardSkeleton } from '@/components/SkeletonLoader';
import {
  expertSuggestions,
  getLocalizedText,
  trendingTopics,
} from '@/data/businessHub';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import type { EnrichedPost } from '@/types/post';

const AVATAR_COLORS = ['#00C9A7', '#FFB547', '#818CF8', '#FB7185', '#22D3EE', '#F472B6', '#34D399', '#38BDF8'];

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

const BASE_CATEGORIES_AR = ['لك', 'الحوكمة', 'الفرص', 'تحليلات'];
const BASE_CATEGORIES_EN = ['For you', 'Governance', 'Opportunities', 'Insights'];

function HeroHeader() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 15, stiffness: 100 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <LinearGradient
        colors={isDark
          ? ['rgba(0,201,167,0.08)', 'rgba(0,201,167,0.02)', 'transparent']
          : ['rgba(0,168,143,0.06)', 'rgba(0,168,143,0.02)', 'transparent']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.heroTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroGreeting, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
            {language === 'ar' ? 'مرحباً بك في' : 'Welcome to'}
          </Text>
          <View style={[styles.heroTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Business
            </Text>
            <Text style={[styles.heroTitleAccent, { color: colors.accent }]}>
              {' '}Hub
            </Text>
          </View>
        </View>
        <View style={[styles.heroActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <LanguageToggle />
          <Pressable
            style={({ pressed }) => [
              styles.heroIconBtn,
              { backgroundColor: isDark ? colors.bgCard : colors.white },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
            testID="search-btn"
            onPress={() => router.push('/explore')}
          >
            <Search color={colors.textSecondary} size={18} strokeWidth={2} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.heroIconBtn,
              { backgroundColor: isDark ? colors.bgCard : colors.white },
              pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
            ]}
            testID="notifications-btn"
            onPress={() => router.push('/notifications')}
          >
            <Bell color={colors.textSecondary} size={18} strokeWidth={2} />
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              style={styles.notifDot}
            />
          </Pressable>
        </View>
      </View>

      <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {[
          { icon: Users, value: '2.4K', label: language === 'ar' ? 'نشط' : 'Active', gradColors: ['#00C9A7', '#00E5C3'] as [string, string] },
          { icon: TrendingUp, value: '156', label: language === 'ar' ? 'اليوم' : 'Today', gradColors: ['#FFB547', '#FFD080'] as [string, string] },
          { icon: Sparkles, value: '48', label: language === 'ar' ? 'خبير' : 'Experts', gradColors: ['#818CF8', '#A5B4FC'] as [string, string] },
        ].map((stat, idx) => (
          <View key={idx} style={[
            styles.statCard,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
          ]}>
            <LinearGradient
              colors={stat.gradColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIconCircle}
            >
              <stat.icon color="#FFF" size={14} strokeWidth={2.5} />
            </LinearGradient>
            <Text style={[styles.statVal, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLbl, { color: colors.textTertiary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

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
      contentContainerStyle={styles.catRow}
      renderItem={({ item }) => {
        const isActive = activeCategory === item || (activeCategory === '' && item === categories[0]);
        return (
          <Pressable
            onPress={() => handleSelect(item)}
            style={({ pressed }) => [
              styles.catPill,
              { backgroundColor: isDark ? colors.bgCard : colors.white },
              isActive && styles.catPillActive,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
          >
            {isActive ? (
              <LinearGradient
                colors={[colors.accent, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            ) : null}
            <Text style={[
              styles.catText,
              { color: colors.textSecondary },
              isActive && { color: '#FFF', fontWeight: '700' as const },
            ]}>{item}</Text>
          </Pressable>
        );
      }}
    />
  );
}

function ComposeBar() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();

  return (
    <PressableScale
      onPress={() => router.push('/create-post')}
      style={[
        styles.composeBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: isDark ? colors.bgCard : colors.white,
        },
      ]}
      haptic
      testID="compose-post"
    >
      <LinearGradient
        colors={[colors.accent, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.composeAvatar}
      >
        <Text style={styles.composeAvatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
      </LinearGradient>
      <Text style={[styles.composePlaceholder, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
        {language === 'ar' ? 'شارك فكرة أو تحليل...' : "Share an insight..."}
      </Text>
      <View style={[styles.composeBtn, { backgroundColor: colors.accentLight }]}>
        <PenLine color={colors.accent} size={15} strokeWidth={2} />
      </View>
    </PressableScale>
  );
}

function ExpertsRow() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.expertsSection}>
      <View style={[styles.sectionHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          <LinearGradient
            colors={[colors.accent, colors.gradientEnd]}
            style={styles.sectionAccent}
          />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {language === 'ar' ? 'خبراء مقترحون' : 'Suggested Experts'}
          </Text>
        </View>
        <Pressable style={({ pressed }) => [
          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 2 },
          pressed && { opacity: 0.6 },
        ]}>
          <Text style={[styles.seeAll, { color: colors.accent }]}>{language === 'ar' ? 'الكل' : 'All'}</Text>
          <ChevronRight color={colors.accent} size={14} strokeWidth={2} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </Pressable>
      </View>
      <FlatList
        horizontal
        inverted={isRTL}
        data={expertSuggestions}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.expertsListContent}
        renderItem={({ item }) => (
          <PressableScale
            style={[
              styles.expertCard,
              { backgroundColor: isDark ? colors.bgCard : colors.white },
            ]}
            testID={`expert-${item.id}`}
          >
            <LinearGradient
              colors={[item.avatarColor, item.avatarColor + 'CC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.expertAvatar}
            >
              <Text style={styles.expertAvatarText}>{item.nameInitial}</Text>
            </LinearGradient>
            <Text style={[styles.expertName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[styles.expertRole, { color: colors.textTertiary }]} numberOfLines={1}>{getLocalizedText(item.role, language)}</Text>
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.expertFollowBtn}
            >
              <Text style={styles.expertFollowText}>{language === 'ar' ? 'متابعة' : 'Follow'}</Text>
            </LinearGradient>
          </PressableScale>
        )}
      />
    </View>
  );
}

function TrendingBar() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.trendingSection}>
      <View style={[styles.sectionHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
          <LinearGradient
            colors={['#FB7185', '#FDA4AF']}
            style={styles.sectionAccent}
          />
          <Text style={[styles.sectionTitleSm, { color: colors.text }]}>
            {language === 'ar' ? 'رائج الآن' : 'Trending Now'}
          </Text>
        </View>
      </View>
      <FlatList
        horizontal
        inverted={isRTL}
        data={trendingTopics}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.trendingRow}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [
            styles.trendChip,
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            item.isHot && { backgroundColor: isDark ? 'rgba(251,113,133,0.1)' : 'rgba(225,29,72,0.06)' },
            pressed && { opacity: 0.7, transform: [{ scale: 0.96 }] },
          ]}>
            {item.isHot ? <Flame color={colors.rose} size={12} /> : null}
            <Text style={[styles.trendText, { color: colors.textSecondary }, item.isHot && { color: colors.rose }]}>
              {getLocalizedText(item.label, language)}
            </Text>
            <View style={[styles.trendCount, { backgroundColor: isDark ? colors.bgElevated : colors.bgMuted }]}>
              <Text style={[styles.trendCountText, { color: colors.textTertiary }]}>{item.posts}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

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
  const slideIn = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, [fadeIn, slideIn]);

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 18, stiffness: 240 }).start();
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
      styles.feedCard,
      {
        transform: [{ scale: scaleAnim }, { translateY: slideIn }],
        opacity: fadeIn,
        backgroundColor: isDark ? colors.bgCard : colors.white,
      },
      isFirst && { borderWidth: 1, borderColor: colors.accent + '30' },
    ]}>
      {isFirst && (
        <LinearGradient
          colors={[colors.accent, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.featuredStripe}
        />
      )}
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} testID={`feed-${post.id}`}>
        <View style={[styles.feedHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => onAuthorPress(post.authorId)}>
            <LinearGradient
              colors={[avatarColor, avatarColor + 'BB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.feedAvatar}
            >
              <Text style={styles.feedAvatarText}>{post.authorInitial}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => onAuthorPress(post.authorId)} style={[styles.feedAuthorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.authorNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.feedAuthorName, { color: colors.text }]}>{post.authorName}</Text>
              {isFirst && (
                <View style={[styles.featuredBadge, { backgroundColor: colors.accentLight }]}>
                  <Sparkles color={colors.accent} size={8} strokeWidth={2.5} />
                </View>
              )}
            </View>
            <Text style={[styles.feedAuthorRole, { color: colors.textTertiary }]} numberOfLines={1}>
              {post.authorRole ? `${post.authorRole}` : ''}{post.authorCompany ? ` · ${post.authorCompany}` : ''}
            </Text>
          </Pressable>
          <Text style={[styles.feedTime, { color: colors.textTertiary }]}>{timeAgo}</Text>
        </View>

        {post.topic ? (
          <View style={[styles.topicRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.topicBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.topicText, { color: colors.accent }]}>{post.topic}</Text>
            </View>
          </View>
        ) : null}

        <Text style={[styles.feedContent, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {post.content}
        </Text>

        <View style={[styles.feedActions, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: isDark ? colors.border : colors.separator }]}>
          <Pressable onPress={handleLike} style={({ pressed }) => [styles.feedAction, pressed && styles.pressed]} testID={`like-${post.id}`}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                color={post.isLiked ? colors.rose : colors.textTertiary}
                fill={post.isLiked ? colors.rose : 'transparent'}
                size={17}
                strokeWidth={1.8}
              />
            </Animated.View>
            <Text style={[styles.feedActionText, { color: colors.textTertiary }, post.isLiked && { color: colors.rose }]}>
              {post.likesCount}
            </Text>
          </Pressable>
          <Pressable onPress={onPress} style={({ pressed }) => [styles.feedAction, pressed && styles.pressed]} testID={`comment-${post.id}`}>
            <MessageCircle color={colors.textTertiary} size={17} strokeWidth={1.8} />
            <Text style={[styles.feedActionText, { color: colors.textTertiary }]}>{post.commentsCount}</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.feedAction, pressed && styles.pressed]} testID={`save-${post.id}`}>
            <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Bookmark
                color={post.isSaved ? colors.accent : colors.textTertiary}
                fill={post.isSaved ? colors.accent : 'transparent'}
                size={17}
                strokeWidth={1.8}
              />
            </Animated.View>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.feedAction, pressed && styles.pressed]}>
            <Share2 color={colors.textTertiary} size={16} strokeWidth={1.8} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
});

function LoadingSkeleton() {
  return (
    <View style={{ paddingTop: 8 }}>
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
    <View style={styles.emptyWrap}>
      <LinearGradient
        colors={[colors.accentSoft, colors.accentSoft2]}
        style={styles.emptyIconOuter}
      >
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentLight }]}>
          <MessageCircle color={colors.accent} size={28} strokeWidth={1.5} />
        </View>
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
        {language === 'ar' ? 'كن أول من يشارك رأيه' : 'Be the first to share an insight'}
      </Text>
      <Pressable
        onPress={() => router.push('/create-post')}
        style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
      >
        <LinearGradient
          colors={[colors.accent, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.emptyBtnGradient}
        >
          <Text style={styles.emptyBtnText}>
            {language === 'ar' ? 'أنشئ منشوراً' : 'Create Post'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
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
    mutationFn: async (postId: string) => {
      return trpcClient.posts.toggleLike.mutate({ postId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => {
      console.log('[HomeScreen] like error', err.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      return trpcClient.posts.toggleSave.mutate({ postId });
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (data.saved) {
        setToastMsg(language === 'ar' ? 'تم الحفظ' : 'Saved');
        setToastVisible(true);
      }
    },
    onError: (err) => {
      console.log('[HomeScreen] save error', err.message);
    },
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

  const listHeader = useMemo(() => (
    <>
      <HeroHeader />
      <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} extraCategories={communityCategories} />
      <ComposeBar />
      <ExpertsRow />
      <TrendingBar />
      <View style={styles.feedDivider}>
        <View style={[styles.feedDividerLine, { backgroundColor: colors.separator }]} />
        <Text style={[styles.feedDividerText, { color: colors.textTertiary }]}>
          {language === 'ar' ? 'آخر المنشورات' : 'Latest Posts'}
        </Text>
        <View style={[styles.feedDividerLine, { backgroundColor: colors.separator }]} />
      </View>
    </>
  ), [activeCategory, communityCategories, language, colors]);

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
            <HeroHeader />
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
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },

  heroSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, overflow: 'hidden' },
  heroTopRow: { alignItems: 'flex-start', justifyContent: 'space-between' },
  heroGreeting: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 1.2, marginBottom: 4, textTransform: 'uppercase' as const },
  heroTitleRow: { alignItems: 'baseline' },
  heroTitle: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.5 },
  heroTitleAccent: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.5 },
  heroActions: { alignItems: 'center', gap: 10, paddingTop: 4 },
  heroIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsRow: { marginTop: 24, gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 8,
  },
  statIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.5 },
  statLbl: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  catRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 16 },
  catPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
  },
  catPillActive: {},
  catText: { fontSize: 13, fontWeight: '600' as const },

  composeBar: {
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 14,
    borderRadius: 20,
  },
  composeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeAvatarText: { color: '#FFF', fontSize: 15, fontWeight: '800' as const },
  composePlaceholder: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  composeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  pressed: { opacity: 0.6 },

  sectionHead: { paddingHorizontal: 20, alignItems: 'center', justifyContent: 'space-between' },
  sectionAccent: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.3 },
  sectionTitleSm: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  seeAll: { fontSize: 13, fontWeight: '600' as const },

  expertsSection: { paddingTop: 24, gap: 14 },
  expertsListContent: { paddingHorizontal: 20, gap: 10 },
  expertCard: {
    width: 130,
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 22,
  },
  expertAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertAvatarText: { color: '#FFF', fontSize: 19, fontWeight: '800' as const },
  expertName: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' as const },
  expertRole: { fontSize: 11, textAlign: 'center' as const, lineHeight: 15 },
  expertFollowBtn: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    borderRadius: 14,
  },
  expertFollowText: { fontSize: 11, fontWeight: '700' as const, color: '#FFF' },

  trendingSection: { paddingTop: 22, gap: 12 },
  trendingRow: { paddingHorizontal: 20, gap: 8, paddingTop: 4 },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  trendText: { fontSize: 13, fontWeight: '600' as const },
  trendCount: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  trendCountText: { fontSize: 10, fontWeight: '700' as const },

  feedDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 4,
    gap: 12,
  },
  feedDividerLine: { flex: 1, height: 1 },
  feedDividerText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },

  feedCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 22,
    overflow: 'hidden',
  },
  featuredStripe: { height: 3 },
  feedHeader: { alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 },
  feedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  feedAuthorInfo: { flex: 1, gap: 2 },
  authorNameRow: { alignItems: 'center', gap: 6 },
  feedAuthorName: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  featuredBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  feedAuthorRole: { fontSize: 12, letterSpacing: -0.1 },
  feedTime: { fontSize: 12, fontWeight: '500' as const },
  topicRow: { paddingHorizontal: 16, paddingBottom: 8 },
  topicBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  topicText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.1 },
  feedContent: { paddingHorizontal: 16, paddingBottom: 14, fontSize: 15, lineHeight: 25, letterSpacing: -0.2 },
  feedActions: {
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  feedAction: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10 },
  feedActionText: { fontSize: 13, fontWeight: '600' as const },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 40, gap: 12 },
  emptyIconOuter: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, textAlign: 'center' as const, lineHeight: 21 },
  emptyBtnGradient: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginTop: 14 },
  emptyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1 },
});
