import React, { useMemo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
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
  Bell,
  Crown,
  FileText,
  Lock,
  MessageCircle,
  Settings,
  Users,
} from 'lucide-react-native';

import { theme } from '@/constants/theme';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toast } from '@/components/Toast';

const TABS_AR = ['نقاشات', 'موارد', 'أعضاء', 'فعاليات'];
const TABS_EN = ['Discussions', 'Resources', 'Members', 'Events'];

const PRIVACY_LABELS: Record<string, Record<string, string>> = {
  public: { ar: 'عام', en: 'Public' },
  private: { ar: 'خاص', en: 'Private' },
  premium: { ar: 'مميز', en: 'Premium' },
};

interface CommunityDetail {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  privacy: 'public' | 'private' | 'premium';
  icon: string;
  accent: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  createdBy: string;
  createdAt: string;
}

interface MemberItem {
  userId: string;
  name: string;
  role: string;
  company: string;
  initial: string;
  isModerator: boolean;
}

interface PostItem {
  id: string;
  authorId: string;
  content: string;
  topic: string;
  createdAt: string;
  authorName: string;
  authorRole: string;
  authorInitial: string;
  likesCount: number;
  commentsCount: number;
}

const AVATAR_COLORS = ['#1B6B4A', '#C4942A', '#3B82F6', '#D44B63', '#7C3AED', '#0891B2'];

function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(dateStr: string, language: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return language === 'ar' ? 'الآن' : 'Just now';
  if (mins < 60) return language === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return language === 'ar' ? `منذ ${days} ي` : `${days}d ago`;
}

export default function CommunityDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const tabs = language === 'ar' ? TABS_AR : TABS_EN;

  const communityQuery = useQuery({
    queryKey: ['communities', 'byId', id],
    queryFn: () => trpcClient.communities.byId.query({ id: id ?? '' }),
    enabled: !!id,
  });

  const membersQuery = useQuery({
    queryKey: ['communities', 'members', id],
    queryFn: () => trpcClient.communities.members.query({ communityId: id ?? '' }),
    enabled: !!id && activeTab === 2,
  });

  const postsQuery = useQuery({
    queryKey: ['communities', 'posts', id],
    queryFn: () => trpcClient.communities.posts.query({ communityId: id ?? '', cursor: 0, limit: 20 }),
    enabled: !!id && activeTab === 0,
  });

  const joinMutation = useMutation({
    mutationFn: () => trpcClient.communities.join.mutate({ communityId: id ?? '' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => trpcClient.communities.leave.mutate({ communityId: id ?? '' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const notifMutation = useMutation({
    mutationFn: () => trpcClient.communities.toggleNotifications.mutate({ communityId: id ?? '' }),
    onSuccess: (data: any) => {
      const enabled = data?.enabled ?? false;
      setToastMsg(enabled
        ? (language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications enabled')
        : (language === 'ar' ? 'تم إيقاف الإشعارات' : 'Notifications disabled'));
      setToastVisible(true);
    },
  });

  const handleRefresh = useCallback(() => {
    void communityQuery.refetch();
    if (activeTab === 0) void postsQuery.refetch();
    if (activeTab === 2) void membersQuery.refetch();
  }, [communityQuery, postsQuery, membersQuery, activeTab]);

  const community = communityQuery.data as CommunityDetail | undefined;

  if (communityQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!community) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.errorText}>{language === 'ar' ? 'المجتمع غير موجود' : 'Community not found'}</Text>
        </SafeAreaView>
      </View>
    );
  }

  const isPremium = community.privacy === 'premium';
  const isPrivate = community.privacy === 'private';
  const displayName = language === 'ar' ? community.nameAr : community.name;
  const displayDesc = language === 'ar' ? community.descriptionAr : community.description;
  const privacyLabel = PRIVACY_LABELS[community.privacy]?.[language] ?? community.privacy;

  const handleJoinToggle = () => {
    if (!isAuthenticated) return;
    if (community.isMember) {
      leaveMutation.mutate();
    } else {
      joinMutation.mutate();
    }
  };

  const isToggling = joinMutation.isPending || leaveMutation.isPending;

  const renderHeader = () => (
    <View>
      <View style={[styles.headerBanner, { backgroundColor: community.accent + '18' }]}>
        <View style={[styles.navRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="community-back">
            {isRTL ? <ArrowRight color={colors.text} size={20} /> : <ArrowLeft color={colors.text} size={20} />}
          </Pressable>
          <View style={[styles.navActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Pressable
              onPress={() => {
                if (!isAuthenticated) return;
                notifMutation.mutate();
              }}
              style={styles.navActionBtn}
            >
              <Bell color={colors.textSecondary} size={18} />
            </Pressable>
            <Pressable
              onPress={() => {
                router.push('/settings');
              }}
              style={styles.navActionBtn}
            >
              <Settings color={colors.textSecondary} size={18} />
            </Pressable>
          </View>
        </View>

        <View style={styles.communityHeader}>
          <View style={[styles.communityIcon, { backgroundColor: community.accent + '25' }]}>
            <Text style={styles.communityEmoji}>{community.icon}</Text>
          </View>
          <Text style={styles.communityName}>{displayName}</Text>
          <Text style={[styles.communityDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
            {displayDesc}
          </Text>

          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Users color={colors.textMuted} size={14} />
              <Text style={styles.metaText}>{community.memberCount} {language === 'ar' ? 'عضو' : 'members'}</Text>
            </View>
            <View style={[styles.metaItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MessageCircle color={colors.textMuted} size={14} />
              <Text style={styles.metaText}>{community.postCount} {language === 'ar' ? 'منشور' : 'posts'}</Text>
            </View>
            <View style={[styles.privacyBadge, isPremium ? styles.premiumBadge : isPrivate ? styles.privateBadge : styles.publicBadge]}>
              {isPremium ? <Crown color={colors.gold} size={11} /> : isPrivate ? <Lock color={colors.sky} size={11} /> : null}
              <Text style={[styles.privacyText, isPremium ? styles.premiumText : isPrivate ? styles.privateText : styles.publicText]}>
                {privacyLabel}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleJoinToggle}
            disabled={isToggling || !isAuthenticated}
            style={[styles.joinBtn, community.isMember ? styles.joinedBtn : { backgroundColor: community.accent }]}
            testID="community-join"
          >
            {isToggling ? (
              <ActivityIndicator size="small" color={community.isMember ? colors.text : colors.white} />
            ) : (
              <Text style={[styles.joinBtnText, community.isMember && styles.joinedBtnText]}>
                {community.isMember
                  ? (language === 'ar' ? 'عضو ✓' : 'Joined ✓')
                  : (language === 'ar' ? 'انضم للمجتمع' : 'Join Community')}
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <FlatList
        horizontal
        inverted={isRTL}
        data={tabs}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => setActiveTab(index)}
            style={[styles.tabItem, activeTab === index && [styles.tabItemActive, { borderBottomColor: community.accent }]]}
          >
            <Text style={[styles.tabText, activeTab === index && [styles.tabTextActive, { color: community.accent }]]}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );

  const renderDiscussions = () => {
    if (postsQuery.isLoading) {
      return (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }

    const postsList = (postsQuery.data?.posts ?? []) as PostItem[];

    if (postsList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <FileText color={colors.textMuted} size={32} />
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}
          </Text>
        </View>
      );
    }

    return (
      <>
        {postsList.map((post) => (
          <Pressable
            key={post.id}
            style={({ pressed }) => [styles.postCard, pressed && { opacity: 0.7 }]}
            onPress={() => router.push(`/post/${post.id}`)}
          >
            <View style={[styles.postRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.postAvatar, { backgroundColor: getAvatarColor(post.authorId) }]}>
                <Text style={styles.postAvatarText}>{post.authorInitial}</Text>
              </View>
              <View style={[styles.postInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={styles.postAuthor}>{post.authorName}</Text>
                <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                  {post.content}
                </Text>
                <View style={[styles.postStats, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.postStatText}>❤️ {post.likesCount}</Text>
                  <Text style={styles.postStatText}>💬 {post.commentsCount}</Text>
                  <Text style={styles.postStatTime}>{timeAgo(post.createdAt, language)}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </>
    );
  };

  const renderMembers = () => {
    if (membersQuery.isLoading) {
      return (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      );
    }

    const membersList = (membersQuery.data ?? []) as MemberItem[];

    if (membersList.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Users color={colors.textMuted} size={32} />
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'لا يوجد أعضاء بعد' : 'No members yet'}
          </Text>
        </View>
      );
    }

    return (
      <>
        {membersList.map((member) => (
          <View key={member.userId} style={[styles.memberRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.memberAvatar, { backgroundColor: getAvatarColor(member.userId) }]}>
              <Text style={styles.memberInitial}>{member.initial}</Text>
            </View>
            <View style={[styles.memberInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role || member.company || (language === 'ar' ? 'عضو' : 'Member')}</Text>
            </View>
            {member.isModerator ? (
              <View style={styles.modBadge}>
                <Text style={styles.modText}>{language === 'ar' ? 'مشرف' : 'Mod'}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </>
    );
  };

  const isPrivateAndNotMember = isPrivate && !community.isMember;

  const renderContent = () => {
    if (isPrivateAndNotMember) {
      return (
        <View style={styles.emptyState}>
          <Lock color={colors.textMuted} size={32} />
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'هذا مجتمع خاص' : 'This is a private community'}
          </Text>
          <Text style={[styles.emptyText, { fontSize: 13 }]}>
            {language === 'ar' ? 'انضم للمجتمع لرؤية المحتوى' : 'Join to see content'}
          </Text>
        </View>
      );
    }
    switch (activeTab) {
      case 0: return renderDiscussions();
      case 2: return renderMembers();
      default: return (
        <View style={styles.emptyState}>
          <FileText color={colors.textMuted} size={32} />
          <Text style={styles.emptyText}>
            {language === 'ar' ? 'سيتوفر المحتوى قريباً' : 'Content coming soon'}
          </Text>
        </View>
      );
    }
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
          testID="community-detail"
          refreshControl={
            <RefreshControl
              refreshing={communityQuery.isRefetching}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
        <Toast visible={toastVisible} message={toastMsg} type="success" onDismiss={() => setToastVisible(false)} />
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
  listContent: {
    paddingBottom: 40,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSection: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  headerBanner: {
    paddingBottom: 0,
  },
  navRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    gap: 6,
  },
  navActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 10,
  },
  communityIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityEmoji: {
    fontSize: 30,
  },
  communityName: {
    ...theme.typography.h1,
    color: c.text,
    textAlign: 'center' as const,
  },
  communityDesc: {
    fontSize: 14,
    color: c.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  metaRow: {
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: c.textMuted,
    fontWeight: '500' as const,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  premiumBadge: {
    backgroundColor: c.goldLight,
  },
  privateBadge: {
    backgroundColor: c.skyLight,
  },
  publicBadge: {
    backgroundColor: c.accentLight,
  },
  privacyText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  premiumText: {
    color: c.gold,
  },
  privateText: {
    color: c.sky,
  },
  publicText: {
    color: c.accent,
  },
  joinBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    marginTop: 4,
    minWidth: 140,
    alignItems: 'center',
  },
  joinedBtn: {
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.border,
  },
  joinBtnText: {
    color: c.white,
    fontSize: 15,
    fontWeight: '700' as const,
  },
  joinedBtnText: {
    color: c.text,
  },
  tabsRow: {
    paddingHorizontal: 20,
    gap: 0,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: c.textMuted,
  },
  tabTextActive: {
    fontWeight: '700' as const,
  },
  contentWrap: {
    paddingTop: 8,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: theme.radius.md,
    backgroundColor: c.bgCard,
    borderWidth: 1,
    borderColor: c.borderLight,
    ...theme.shadow.sm,
  },
  postRow: {
    gap: 10,
    alignItems: 'flex-start',
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    color: c.white,
    fontSize: 14,
    fontWeight: '700' as const,
  },
  postInfo: {
    flex: 1,
    gap: 4,
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: c.text,
  },
  postContent: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
  },
  postStats: {
    gap: 12,
    paddingTop: 4,
  },
  postStatText: {
    fontSize: 12,
    color: c.textMuted,
  },
  postStatTime: {
    fontSize: 12,
    color: c.textMuted,
  },
  memberRow: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: {
    color: c.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  memberInfo: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: c.text,
  },
  memberRole: {
    fontSize: 12,
    color: c.textMuted,
  },
  modBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
    backgroundColor: c.accentLight,
  },
  modText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: c.accent,
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
