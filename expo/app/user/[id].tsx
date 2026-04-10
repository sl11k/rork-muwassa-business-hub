// Muwassa Business Hub — id screen
import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Heart,
  MapPin,
  MessageCircle,
  Send,
  Star,
  Trophy,
  UserPlus,
  UserMinus,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import type { EnrichedPost } from '@/types/post';

import { getAvatarColor as _getAvatarColorTheme } from '@/constants/theme';
const REPUTATION_LEVELS = [
  { emoji: '🌱', labelAr: 'مساهم', labelEn: 'Contributor' },
  { emoji: '⭐', labelAr: 'متخصص', labelEn: 'Specialist' },
  { emoji: '🏆', labelAr: 'خبير', labelEn: 'Expert' },
  { emoji: '👑', labelAr: 'قائد', labelEn: 'Leader' },
];

function getAvatarColor(str: string): string {
  return _getAvatarColorTheme(str);
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TABS_AR = ['المنشورات', 'الخدمات'];
const TABS_EN = ['Posts', 'Services'];

export default function UserProfileScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const tabs = language === 'ar' ? TABS_AR : TABS_EN;

  const profileQuery = useQuery({
    queryKey: ['users', 'profile', id],
    queryFn: () => trpcClient.users.profile.query({ userId: id ?? '' }),
    enabled: !!id,
  });

  const postsQuery = useQuery({
    queryKey: ['users', 'userPosts', id],
    queryFn: () => trpcClient.users.userPosts.query({ userId: id ?? '' }),
    enabled: !!id && activeTab === 0,
  });

  const servicesQuery = useQuery({
    queryKey: ['users', 'userServices', id],
    queryFn: () => trpcClient.users.userServices.query({ userId: id ?? '' }),
    enabled: !!id && activeTab === 1,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (profileQuery.data?.isFollowing) {
        return trpcClient.users.unfollow.mutate({ targetUserId: id ?? '' });
      }
      return trpcClient.users.follow.mutate({ targetUserId: id ?? '' });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users', 'profile', id] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleMessage = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      const result = await trpcClient.messages.getOrCreate.mutate({ otherUserId: id ?? '' });
      router.push(`/chat/${result.conversationId}`);
    } catch (err) {
      console.log('[UserProfile] message error', err);
    }
  }, [isAuthenticated, id, router]);

  const handleRefresh = useCallback(() => {
    void profileQuery.refetch();
    if (activeTab === 0) void postsQuery.refetch();
    if (activeTab === 1) void servicesQuery.refetch();
  }, [profileQuery, postsQuery, servicesQuery, activeTab]);

  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safe}>
          <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
            </Pressable>
            <Text style={styles.navTitle}>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</Text>
            <View style={{ width: 38 }} />
          </View>
          <Text style={styles.errorText}>{language === 'ar' ? 'المستخدم غير موجود' : 'User not found'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  const avatarColor = getAvatarColor(profile.userId);
  const nameInitial = (profile.name || 'U').charAt(0).toUpperCase();
  const repLevel = profile.reputationLevel ?? 0;
  const repLabel = language === 'ar' ? REPUTATION_LEVELS[repLevel].labelAr : REPUTATION_LEVELS[repLevel].labelEn;
  const isOwnProfile = profile.isOwnProfile;

  const renderHeader = () => (
    <View>
      <View style={[styles.navBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="user-back">
          {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
        </Pressable>
        <Text style={styles.navTitle}>{profile.name}</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.profileSection}>
        <View style={[styles.avatarLarge, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{nameInitial}</Text>
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        {profile.role ? (
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Briefcase color={colors.textMuted} size={14} />
            <Text style={styles.detailText}>{profile.role}</Text>
          </View>
        ) : null}
        {profile.company ? (
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Building2 color={colors.textMuted} size={14} />
            <Text style={styles.detailText}>{profile.company}</Text>
          </View>
        ) : null}
        {profile.location ? (
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <MapPin color={colors.textMuted} size={14} />
            <Text style={styles.detailText}>{profile.location}</Text>
          </View>
        ) : null}
        {profile.industry ? (
          <View style={[styles.detailRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Star color={colors.textMuted} size={14} />
            <Text style={styles.detailText}>
              {profile.industry}{profile.experience ? ` · ${profile.experience}` : ''}
            </Text>
          </View>
        ) : null}

        <View style={styles.repBadge}>
          <Trophy color={colors.gold} size={13} />
          <Text style={styles.repText}>{REPUTATION_LEVELS[repLevel].emoji} {repLabel}</Text>
        </View>

        <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.statCard, styles.statBorder]}>
            <Text style={styles.statValue}>{profile.stats?.postsCount ?? 0}</Text>
            <Text style={styles.statLabel}>{language === 'ar' ? 'منشورات' : 'Posts'}</Text>
          </View>
          <View style={[styles.statCard, styles.statBorder]}>
            <Text style={styles.statValue}>{profile.followersCount ?? 0}</Text>
            <Text style={styles.statLabel}>{language === 'ar' ? 'متابِع' : 'Followers'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.followingCount ?? 0}</Text>
            <Text style={styles.statLabel}>{language === 'ar' ? 'يتابع' : 'Following'}</Text>
          </View>
        </View>

        {profile.bio ? (
          <Text style={[styles.bio, { textAlign: isRTL ? 'right' : 'left' }]}>{profile.bio}</Text>
        ) : null}

        {!isOwnProfile ? (
          <View style={[styles.actionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable
              onPress={() => {
                if (!isAuthenticated) { router.push('/login'); return; }
                followMutation.mutate();
              }}
              disabled={followMutation.isPending}
              style={[
                styles.followBtn,
                profile.isFollowing ? styles.followingBtn : styles.notFollowingBtn,
              ]}
            >
              {followMutation.isPending ? (
                <ActivityIndicator size="small" color={profile.isFollowing ? colors.text : colors.white} />
              ) : (
                <>
                  {profile.isFollowing ? (
                    <UserMinus color={colors.text} size={16} />
                  ) : (
                    <UserPlus color={colors.white} size={16} />
                  )}
                  <Text style={[styles.followBtnText, profile.isFollowing && styles.followingBtnText]}>
                    {profile.isFollowing
                      ? (language === 'ar' ? 'إلغاء المتابعة' : 'Unfollow')
                      : (language === 'ar' ? 'متابعة' : 'Follow')}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable onPress={handleMessage} style={styles.messageBtn}>
              <Send color={colors.accent} size={16} />
              <Text style={styles.messageBtnText}>{language === 'ar' ? 'رسالة' : 'Message'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {tabs.map((tab, index) => (
          <Pressable
            key={tab}
            onPress={() => {
              setActiveTab(index);
              void Haptics.selectionAsync();
            }}
            style={[styles.tabItem, activeTab === index && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>{tab}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderPostItem = ({ item }: { item: EnrichedPost }) => (
    <Pressable
      onPress={() => router.push(`/post/${item.id}`)}
      style={({ pressed }) => [styles.postCard, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={3}>
        {item.content}
      </Text>
      {item.topic ? (
        <View style={[styles.topicBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={styles.topicText}>{item.topic}</Text>
        </View>
      ) : null}
      <View style={[styles.postMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.postMetaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Heart color={colors.textMuted} size={13} />
          <Text style={styles.postMetaText}>{item.likesCount}</Text>
        </View>
        <View style={[styles.postMetaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <MessageCircle color={colors.textMuted} size={13} />
          <Text style={styles.postMetaText}>{item.commentsCount}</Text>
        </View>
        <Text style={styles.postMetaTime}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );

  const renderServiceItem = ({ item }: { item: any }) => (
    <Pressable
      onPress={() => router.push(`/service/${item.id}`)}
      style={({ pressed }) => [styles.serviceCard, pressed && { opacity: 0.7 }]}
    >
      <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {language === 'ar' ? item.titleAr : item.title}
      </Text>
      <Text style={[styles.serviceDesc, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
        {language === 'ar' ? item.descriptionAr : item.description}
      </Text>
      <View style={[styles.serviceMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.servicePrice}>{language === 'ar' ? item.priceAr : item.price}</Text>
        <Text style={styles.serviceDelivery}>{language === 'ar' ? item.deliveryAr : item.delivery}</Text>
      </View>
    </Pressable>
  );

  const renderContent = () => {
    if (activeTab === 0) {
      const posts = postsQuery.data ?? [];
      if (postsQuery.isLoading) {
        return <ActivityIndicator style={{ marginTop: 30 }} color={colors.accent} />;
      }
      if (posts.length === 0) {
        return (
          <View style={styles.emptyState}>
            <MessageCircle color={colors.textMuted} size={32} />
            <Text style={styles.emptyText}>{language === 'ar' ? 'لا توجد منشورات' : 'No posts yet'}</Text>
          </View>
        );
      }
      return posts.map((post: EnrichedPost) => (
        <View key={post.id}>{renderPostItem({ item: post })}</View>
      ));
    }

    if (activeTab === 1) {
      const services = servicesQuery.data ?? [];
      if (servicesQuery.isLoading) {
        return <ActivityIndicator style={{ marginTop: 30 }} color={colors.accent} />;
      }
      if (services.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Briefcase color={colors.textMuted} size={32} />
            <Text style={styles.emptyText}>{language === 'ar' ? 'لا توجد خدمات' : 'No services yet'}</Text>
          </View>
        );
      }
      return services.map((s: any) => (
        <View key={s.id}>{renderServiceItem({ item: s })}</View>
      ));
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <FlatList
          data={[{ key: 'content' }]}
          keyExtractor={(item) => item.key}
          renderItem={() => <View style={styles.contentWrap}>{renderContent()}</View>}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          testID="user-profile"
          refreshControl={
            <RefreshControl
              refreshing={profileQuery.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
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
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center' as const,
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 40,
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
    ...theme.typography.h3,
    color: c.text,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    gap: 8,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: c.white,
    fontSize: 30,
    fontWeight: '700' as const,
  },
  profileName: {
    ...theme.typography.h1,
    color: c.text,
    textAlign: 'center' as const,
  },
  detailRow: {
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: c.textSecondary,
    fontWeight: '500' as const,
  },
  repBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    backgroundColor: c.goldLight,
    marginTop: 4,
  },
  repText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: c.gold,
  },
  statsRow: {
    backgroundColor: c.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    overflow: 'hidden',
    marginTop: 12,
    alignSelf: 'stretch',
    marginHorizontal: 0,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 2,
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: c.divider,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: c.text,
  },
  statLabel: {
    fontSize: 11,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
    color: c.textSecondary,
    marginTop: 8,
    alignSelf: 'stretch',
    paddingHorizontal: 4,
  },
  actionRow: {
    gap: 10,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  followBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
  },
  notFollowingBtn: {
    backgroundColor: c.accent,
  },
  followingBtn: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.white,
  },
  followingBtnText: {
    color: c.text,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: c.accent,
    backgroundColor: c.accentLight,
  },
  messageBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.accent,
  },
  tabsRow: {
    paddingHorizontal: 20,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  tabItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: c.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.textMuted,
  },
  tabTextActive: {
    color: c.accent,
    fontWeight: '700' as const,
  },
  contentWrap: {
    paddingTop: 4,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 8,
    ...theme.shadow.sm,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 22,
    color: c.text,
  },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  topicText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: c.accent,
  },
  postMeta: {
    gap: 14,
    alignItems: 'center',
    paddingTop: 4,
  },
  postMetaItem: {
    alignItems: 'center',
    gap: 4,
  },
  postMetaText: {
    fontSize: 12,
    color: c.textMuted,
  },
  postMetaTime: {
    fontSize: 12,
    color: c.textMuted,
    marginLeft: 'auto' as any,
  },
  serviceCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    borderRadius: theme.radius.lg,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    gap: 8,
    ...theme.shadow.sm,
  },
  serviceTitle: {
    ...theme.typography.h3,
    color: c.text,
  },
  serviceDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },
  serviceMeta: {
    gap: 12,
    alignItems: 'center',
    paddingTop: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.accent,
  },
  serviceDelivery: {
    fontSize: 12,
    color: c.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: c.textMuted,
  },
});
