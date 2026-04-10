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
  Plus,
  Search,
  Share2,
  Sparkles,
  TrendingUp,
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

const AVATAR_COLORS = ['#D4A254', '#4A9FF5', '#2DD4A8', '#FB7185', '#8B8DF8', '#F472B6', '#22D3EE', '#FBBF24'];

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

function AppHeader() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={[hs.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[hs.logoArea, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[hs.logoText, { color: colors.text }]}>
          {language === 'ar' ? 'مُوسع' : 'Muwassa'}
        </Text>
        <View style={[hs.logoBadge, { backgroundColor: colors.accentLight }]}>
          <View style={[hs.logoDotInner, { backgroundColor: colors.accent }]} />
        </View>
      </View>
      <View style={[hs.headerActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <LanguageToggle />
        <Pressable
          style={({ pressed }) => [
            hs.headerBtn,
            { backgroundColor: isDark ? colors.bgCard : colors.bgMuted },
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
          ]}
          testID="search-btn"
          onPress={() => router.push('/explore')}
        >
          <Search color={colors.textSecondary} size={18} strokeWidth={1.8} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            hs.headerBtn,
            { backgroundColor: isDark ? colors.bgCard : colors.bgMuted },
            pressed && { opacity: 0.7, transform: [{ scale: 0.9 }] },
          ]}
          testID="notifications-btn"
          onPress={() => router.push('/notifications')}
        >
          <Bell color={colors.textSecondary} size={18} strokeWidth={1.8} />
          <View style={[hs.notifDot, { backgroundColor: colors.rose }]} />
        </Pressable>
      </View>
    </View>
  );
}

const hs = StyleSheet.create({
  header: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  logoArea: { alignItems: 'center', gap: 8 },
  logoText: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -1 },
  logoBadge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  logoDotInner: { width: 8, height: 8, borderRadius: 4 },
  headerActions: { alignItems: 'center', gap: 6 },
  headerBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, borderWidth: 1.5, borderColor: '#000' },
});

function StoriesRow() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const stories = useMemo(() => [
    { id: 'add', type: 'add' as const, name: language === 'ar' ? 'جديد' : 'New' },
    ...expertSuggestions.map((e) => ({
      id: e.id,
      type: 'expert' as const,
      name: e.name.split(' ')[0],
      initial: e.nameInitial,
      color: e.avatarColor,
    })),
    { id: 'trending', type: 'trending' as const, name: language === 'ar' ? 'رائج' : 'Trending', initial: '🔥', color: '#FB7185' },
  ], [language]);

  return (
    <View style={sr.container}>
      <FlatList
        horizontal
        inverted={isRTL}
        data={stories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={sr.listContent}
        renderItem={({ item }) => {
          if (item.type === 'add') {
            return (
              <Pressable
                onPress={() => { router.push('/create-post'); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={({ pressed }) => [sr.storyItem, pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] }]}
              >
                <LinearGradient
                  colors={[colors.accent, colors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={sr.addCircle}
                >
                  <Plus color="#FFF" size={22} strokeWidth={2.5} />
                </LinearGradient>
                <Text style={[sr.storyName, { color: colors.textSecondary }]}>{item.name}</Text>
              </Pressable>
            );
          }
          return (
            <Pressable
              onPress={() => void Haptics.selectionAsync()}
              style={({ pressed }) => [sr.storyItem, pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] }]}
            >
              <LinearGradient
                colors={item.type === 'trending' ? ['#FB7185', '#F472B6'] : [colors.storyRing1, colors.storyRing2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={sr.storyRing}
              >
                <View style={[sr.storyRingInner, { backgroundColor: isDark ? colors.bg : colors.bgCard }]}>
                  <View style={[sr.storyCircle, { backgroundColor: 'color' in item ? item.color : colors.accent }]}>
                    {'initial' in item ? (
                      <Text style={sr.storyInitial}>{item.initial}</Text>
                    ) : null}
                  </View>
                </View>
              </LinearGradient>
              <Text style={[sr.storyName, { color: colors.textSecondary }]} numberOfLines={1}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  container: { paddingTop: 2, paddingBottom: 18 },
  listContent: { paddingHorizontal: 16, gap: 12 },
  storyItem: { alignItems: 'center', width: 72, gap: 6 },
  addCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  storyRing: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center', padding: 2.5 },
  storyRingInner: { width: 61, height: 61, borderRadius: 30.5, alignItems: 'center', justifyContent: 'center' },
  storyCircle: { width: 55, height: 55, borderRadius: 27.5, alignItems: 'center', justifyContent: 'center' },
  storyInitial: { color: '#FFF', fontSize: 20, fontWeight: '700' as const },
  storyName: { fontSize: 11, fontWeight: '500' as const, textAlign: 'center' as const },
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
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  },
              pressed && { transform: [{ scale: 0.93 }] },
            ]}
          >
            <Text style={[
              ct.text,
              { color: isActive ? '#000' : colors.textSecondary },
              isActive && { fontWeight: '700' as const },
            ]}>{item}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const ct = StyleSheet.create({
  row: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  pill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  text: { fontSize: 13, fontWeight: '600' as const },
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
          backgroundColor: isDark ? colors.bgCard : colors.white,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        },
      ]}
      haptic
      testID="compose-post"
    >
      <LinearGradient
        colors={[colors.accent, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cb.avatar}
      >
        <Text style={cb.avatarText}>{(profile?.name ?? 'U').charAt(0).toUpperCase()}</Text>
      </LinearGradient>
      <Text style={[cb.placeholder, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
        {language === 'ar' ? 'شارك فكرة أو تحليل...' : "Share an insight..."}
      </Text>
      <View style={[cb.btn, { backgroundColor: colors.accentSoft }]}>
        <Sparkles color={colors.accent} size={14} strokeWidth={2} />
      </View>
    </PressableScale>
  );
}

const cb = StyleSheet.create({
  bar: { alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 6, padding: 12, borderRadius: 20 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 15, fontWeight: '800' as const },
  placeholder: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  btn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});

function ExpertsRow() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={er.section}>
      <View style={[er.head, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
        <Text style={[er.title, { color: colors.text }]}>
          {language === 'ar' ? 'خبراء مقترحون' : 'Suggested Experts'}
        </Text>
        <Pressable style={({ pressed }) => [
          { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 2 },
          pressed && { opacity: 0.6 },
        ]}>
          <Text style={[er.seeAll, { color: colors.accent }]}>{language === 'ar' ? 'الكل' : 'All'}</Text>
          <ChevronRight color={colors.accent} size={14} strokeWidth={2} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </Pressable>
      </View>
      <FlatList
        horizontal
        inverted={isRTL}
        data={expertSuggestions}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={er.listContent}
        renderItem={({ item }) => (
          <PressableScale
            style={[
              er.card,
              {
                backgroundColor: isDark ? colors.bgCard : colors.white,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              },
            ]}
            testID={`expert-${item.id}`}
          >
            <View style={[er.avatar, { backgroundColor: item.avatarColor }]}>
              <Text style={er.avatarText}>{item.nameInitial}</Text>
            </View>
            <Text style={[er.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
            <Text style={[er.role, { color: colors.textTertiary }]} numberOfLines={1}>{getLocalizedText(item.role, language)}</Text>
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={er.followBtn}
            >
              <Text style={er.followText}>{language === 'ar' ? 'متابعة' : 'Follow'}</Text>
            </LinearGradient>
          </PressableScale>
        )}
      />
    </View>
  );
}

const er = StyleSheet.create({
  section: { paddingTop: 20, gap: 14 },
  head: { alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: '600' as const },
  listContent: { paddingHorizontal: 16, gap: 10 },
  card: { width: 130, alignItems: 'center', gap: 8, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 20 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 19, fontWeight: '800' as const },
  name: { fontSize: 13, fontWeight: '700' as const, textAlign: 'center' as const },
  role: { fontSize: 11, textAlign: 'center' as const, lineHeight: 15 },
  followBtn: { paddingHorizontal: 22, paddingVertical: 8, borderRadius: 14, marginTop: 4 },
  followText: { fontSize: 12, fontWeight: '700' as const, color: '#FFF' },
});

function TrendingBar() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  return (
    <View style={tb.section}>
      <View style={[tb.head, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
          <TrendingUp color={colors.rose} size={16} strokeWidth={2} />
          <Text style={[tb.title, { color: colors.text }]}>
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
        contentContainerStyle={tb.row}
        renderItem={({ item }) => (
          <Pressable style={({ pressed }) => [
            tb.chip,
            {
              backgroundColor: isDark
                ? (item.isHot ? 'rgba(251,113,133,0.08)' : 'rgba(255,255,255,0.04)')
                : (item.isHot ? 'rgba(214,41,74,0.06)' : 'rgba(0,0,0,0.03)'),
              borderWidth: 1,
              borderColor: item.isHot
                ? (isDark ? 'rgba(251,113,133,0.15)' : 'rgba(214,41,74,0.10)')
                : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
            },
            pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
          ]}>
            {item.isHot ? <Flame color={colors.rose} size={12} /> : null}
            <Text style={[tb.text, { color: colors.textSecondary }, item.isHot && { color: colors.rose }]}>
              {getLocalizedText(item.label, language)}
            </Text>
            <View style={[tb.count, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Text style={[tb.countText, { color: colors.textTertiary }]}>{item.posts}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const tb = StyleSheet.create({
  section: { paddingTop: 20, gap: 12 },
  head: { alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.2 },
  row: { paddingHorizontal: 16, gap: 8, paddingTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  text: { fontSize: 13, fontWeight: '600' as const },
  count: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  countText: { fontSize: 10, fontWeight: '700' as const },
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
  const slideIn = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 130 }),
    ]).start();
  }, [fadeIn, slideIn]);

  const onPressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.975, useNativeDriver: true, damping: 18, stiffness: 240 }).start();
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
        backgroundColor: isDark ? colors.bgCard : colors.white,
      },
      isFirst && fc.featuredCard,
    ]}>
      {isFirst && (
        <LinearGradient
          colors={[colors.accent, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={fc.featuredStripe}
        />
      )}
      <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress} testID={`feed-${post.id}`}>
        <View style={[fc.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => onAuthorPress(post.authorId)}>
            <View style={[fc.avatar, { backgroundColor: avatarColor }]}>
              <Text style={fc.avatarText}>{post.authorInitial}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => onAuthorPress(post.authorId)} style={[fc.authorInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[fc.authorNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[fc.authorName, { color: colors.text }]}>{post.authorName}</Text>
              {isFirst && (
                <View style={[fc.featuredBadge, { backgroundColor: colors.accentLight }]}>
                  <Sparkles color={colors.accent} size={8} strokeWidth={2.5} />
                </View>
              )}
            </View>
            <Text style={[fc.authorRole, { color: colors.textTertiary }]} numberOfLines={1}>
              {post.authorRole ? `${post.authorRole}` : ''}{post.authorCompany ? ` · ${post.authorCompany}` : ''}
            </Text>
          </Pressable>
          <Text style={[fc.time, { color: colors.textTertiary }]}>{timeAgo}</Text>
        </View>

        {post.topic ? (
          <View style={[fc.topicRow, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[fc.topicBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[fc.topicText, { color: colors.accent }]}>{post.topic}</Text>
            </View>
          </View>
        ) : null}

        <Text style={[fc.content, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {post.content}
        </Text>

        <View style={[fc.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={handleLike} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`like-${post.id}`}>
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Heart
                color={post.isLiked ? colors.rose : colors.textTertiary}
                fill={post.isLiked ? colors.rose : 'transparent'}
                size={18}
                strokeWidth={1.8}
              />
            </Animated.View>
            <Text style={[fc.actionText, { color: colors.textTertiary }, post.isLiked && { color: colors.rose }]}>
              {post.likesCount}
            </Text>
          </Pressable>
          <Pressable onPress={onPress} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`comment-${post.id}`}>
            <MessageCircle color={colors.textTertiary} size={18} strokeWidth={1.8} />
            <Text style={[fc.actionText, { color: colors.textTertiary }]}>{post.commentsCount}</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={({ pressed }) => [fc.action, pressed && fc.pressed]} testID={`save-${post.id}`}>
            <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Bookmark
                color={post.isSaved ? colors.accent : colors.textTertiary}
                fill={post.isSaved ? colors.accent : 'transparent'}
                size={18}
                strokeWidth={1.8}
              />
            </Animated.View>
          </Pressable>
          <Pressable style={({ pressed }) => [fc.action, pressed && fc.pressed]}>
            <Share2 color={colors.textTertiary} size={16} strokeWidth={1.8} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const fc = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 10, borderRadius: 20, overflow: 'hidden' },
  featuredCard: {
    shadowColor: '#D4A254',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  featuredStripe: { height: 3 },
  header: { alignItems: 'center', gap: 10, padding: 16, paddingBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  authorInfo: { flex: 1, gap: 2 },
  authorNameRow: { alignItems: 'center', gap: 6 },
  authorName: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  featuredBadge: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  authorRole: { fontSize: 12, letterSpacing: -0.1 },
  time: { fontSize: 12, fontWeight: '500' as const },
  topicRow: { paddingHorizontal: 16, paddingBottom: 6 },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  topicText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.1 },
  content: { paddingHorizontal: 16, paddingBottom: 14, fontSize: 15, lineHeight: 24, letterSpacing: -0.2 },
  actions: { justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 12 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  actionText: { fontSize: 13, fontWeight: '600' as const },
  pressed: { opacity: 0.6 },
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
    <View style={ef.wrap}>
      <View style={[ef.iconOuter, { backgroundColor: colors.accentSoft }]}>
        <View style={[ef.iconWrap, { backgroundColor: colors.accentLight }]}>
          <MessageCircle color={colors.accent} size={28} strokeWidth={1.5} />
        </View>
      </View>
      <Text style={[ef.title, { color: colors.text }]}>
        {language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
      </Text>
      <Text style={[ef.desc, { color: colors.textSecondary }]}>
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
          style={ef.btn}
        >
          <Text style={ef.btnText}>
            {language === 'ar' ? 'أنشئ منشوراً' : 'Create Post'}
          </Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const ef = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: 40, gap: 12 },
  iconOuter: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.3 },
  desc: { fontSize: 14, textAlign: 'center' as const, lineHeight: 21 },
  btn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginTop: 14 },
  btnText: { color: '#FFF', fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.1 },
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
      <AppHeader />
      <StoriesRow />
      <CategoryTabs activeCategory={activeCategory} onSelect={setActiveCategory} extraCategories={communityCategories} />
      <ComposeBar />
      <ExpertsRow />
      <TrendingBar />
      <View style={fd.divider}>
        <View style={[fd.dividerLine, { backgroundColor: colors.separator }]} />
        <Text style={[fd.dividerText, { color: colors.textTertiary }]}>
          {language === 'ar' ? 'آخر المنشورات' : 'Latest Posts'}
        </Text>
        <View style={[fd.dividerLine, { backgroundColor: colors.separator }]} />
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
            pressed && { opacity: 0.9, transform: [{ scale: 0.9 }] },
          ]}
          testID="fab-create"
        >
          <LinearGradient
            colors={[colors.accent, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Plus color="#FFF" size={24} strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>

        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
      </SafeAreaView>
    </View>
  );
}

const fd = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 4, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
});

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 100 },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: '#D4A254',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
