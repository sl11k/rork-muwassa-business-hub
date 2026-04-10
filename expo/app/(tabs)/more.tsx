// Muwassa Business Hub — more screen
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Grid3X3,
  Heart,
  LogOut,
  MessageCircle,
  Settings,
  Tag,
  UserCircle2,
} from 'lucide-react-native';

import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import type { EnrichedPost } from '@/types/post';

interface UserStats {
  postsCount: number;
  commentsCount: number;
  receivedLikes: number;
  servicesCount: number;
  completedServices: number;
  communitiesJoined: number;
  postsThisMonth: number;
  reputationLevel: number;
  reputationProgress: number;
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

function ProfileHeader({ stats }: { stats: UserStats | null }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { profile, isAuthenticated, user } = useAuth();
  const { colors, isDark } = useTheme();

  const displayName = profile?.name || (language === 'ar' ? 'زائر' : 'Guest');
  const displayRole = profile?.role || (language === 'ar' ? 'مستخدم جديد' : 'New member');
  const nameInitial = displayName.charAt(0).toUpperCase();
  const username = user?.email?.split('@')[0] ?? '';

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `businesshub.app/u/${username}`,
      });
    } catch (err) {
      console.log('[Profile] share error', err);
    }
  }, [username]);

  return (
    <View style={ph.section}>
      <View style={[ph.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[ph.screenTitle, { color: colors.text }]}>
          {isAuthenticated ? (username || displayName) : (language === 'ar' ? 'الملف الشخصي' : 'Profile')}
        </Text>
        <View style={[ph.topActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <LanguageToggle />
          {isAuthenticated && (
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [
                ph.settingsBtn,
                { backgroundColor: isDark ? colors.bgCard : colors.bgMuted },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Settings color={colors.textSecondary} size={18} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
      </View>

      <View style={ph.profileArea}>
        <View style={[ph.avatar, { backgroundColor: colors.accent }]}>
          {isAuthenticated ? (
            <Text style={ph.avatarText}>{nameInitial}</Text>
          ) : (
            <UserCircle2 color="#FFF" size={28} strokeWidth={1.5} />
          )}
        </View>
        <Text style={[ph.name, { color: colors.text }]}>{displayName}</Text>
        <Text style={[ph.role, { color: colors.textSecondary }]}>{displayRole}</Text>
        {isAuthenticated && username ? (
          <Text style={[ph.link, { color: colors.accent }]}>businesshub.app/u/{username}</Text>
        ) : null}
      </View>

      <View style={[
        ph.statsCard,
        {
          backgroundColor: isDark ? colors.bgCard : colors.white,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.cardShadow,
          shadowOpacity: 1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
      ]}>
        <View style={ph.statItem}>
          <Text style={[ph.statValue, { color: colors.text }]}>{stats?.postsCount ?? 0}</Text>
          <Text style={[ph.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'منشورات' : 'Posts'}</Text>
        </View>
        <View style={ph.statItem}>
          <Text style={[ph.statValue, { color: colors.text }]}>0</Text>
          <Text style={[ph.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'متابعين' : 'Followers'}</Text>
        </View>
        <View style={ph.statItem}>
          <Text style={[ph.statValue, { color: colors.text }]}>0</Text>
          <Text style={[ph.statLabel, { color: colors.textMuted }]}>{language === 'ar' ? 'يتابعهم' : 'Following'}</Text>
        </View>
      </View>

      {isAuthenticated ? (
        <View style={[ph.btnRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/edit-profile'); }}
            style={({ pressed }) => [
              ph.editBtn,
              { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary },
              pressed && { opacity: 0.8 },
            ]}
            testID="edit-profile-btn"
          >
            <Text style={[ph.editBtnText, { color: colors.text }]}>
              {language === 'ar' ? 'تعديل البروفايل' : 'Edit Profile'}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              ph.editBtn,
              { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={[ph.editBtnText, { color: colors.text }]}>
              {language === 'ar' ? 'مشاركة البروفايل' : 'Share Profile'}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/login'); }}
          style={({ pressed }) => [ph.signInBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          testID="profile-login-btn"
        >
          <Text style={ph.signInBtnText}>
            {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const ph = StyleSheet.create({
  section: { gap: 12, paddingBottom: 8 },
  topRow: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  screenTitle: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.3 },
  topActions: { alignItems: 'center', gap: 8 },
  settingsBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  profileArea: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  avatar: { width: 76, height: 76, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: '700' as const, color: '#FFF' },
  name: { fontSize: 20, fontWeight: '700' as const },
  role: { fontSize: 14 },
  link: { fontSize: 13 },
  statsCard: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '700' as const },
  statLabel: { fontSize: 12 },
  btnRow: { gap: 8, paddingHorizontal: 16 },
  editBtn: { flex: 1, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 13, fontWeight: '600' as const },
  signInBtn: { marginHorizontal: 16, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  signInBtnText: { fontSize: 15, fontWeight: '600' as const, color: '#FFF' },
});

function ProfileTabs({ activeTab, onSelect }: { activeTab: number; onSelect: (i: number) => void }) {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const tabs = language === 'ar' ? ['المنشورات', 'الخدمات'] : ['Posts', 'Services'];
  const icons = [Grid3X3, Tag];

  return (
    <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
      {tabs.map((item, index) => {
        const Icon = icons[index];
        return (
          <Pressable
            key={item}
            onPress={() => { onSelect(index); void Haptics.selectionAsync(); }}
            style={({ pressed }) => [styles.profileTabItem, pressed && { opacity: 0.6 }]}
          >
            <Icon color={activeTab === index ? colors.text : colors.textMuted} size={18} strokeWidth={1.8} />
            <Text style={[styles.tabText, { color: activeTab === index ? colors.text : colors.textMuted }]}>{item}</Text>
            {activeTab === index && <View style={[styles.tabIndicator, { backgroundColor: colors.accent }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

function MyPostsList({ userId }: { userId: string }) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await trpcClient.users.userPosts.query({ userId });
        setPosts(data);
      } catch (err) {
        console.log('[Profile] my posts error', err);
      } finally {
        setLoading(false);
      }
    })().catch(() => {});
  }, [userId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />;
  if (posts.length === 0) {
    return (
      <View style={styles.emptyTab}>
        <View style={[styles.emptyTabIcon, { backgroundColor: colors.accentLight }]}>
          <Grid3X3 color={colors.accent} size={22} strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>{language === 'ar' ? 'لا توجد منشورات بعد' : 'No posts yet'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.tabListContent}>
      {posts.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={({ pressed }) => [
            styles.postCard,
            {
              backgroundColor: isDark ? colors.bgCard : colors.white,
              borderWidth: 1,
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
          <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={3}>
            {post.content}
          </Text>
          {post.topic ? (
            <View style={[styles.topicBadge, { alignSelf: isRTL ? 'flex-end' : 'flex-start', backgroundColor: colors.accentLight }]}>
              <Text style={[styles.topicText, { color: colors.accent }]}>#{post.topic}</Text>
            </View>
          ) : null}
          <View style={[styles.postMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <Heart color={colors.textMuted} size={12} strokeWidth={1.8} />
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>{post.likesCount}</Text>
            </View>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
              <MessageCircle color={colors.textMuted} size={12} strokeWidth={1.8} />
              <Text style={[styles.postMetaText, { color: colors.textSecondary }]}>{post.commentsCount}</Text>
            </View>
            <Text style={[styles.postMetaTime, { color: colors.textMuted }]}>{formatTimeAgo(post.createdAt)}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ServicesTab() {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.emptyTab}>
      <View style={[styles.emptyTabIcon, { backgroundColor: colors.accentLight }]}>
        <Tag color={colors.accent} size={22} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTabText, { color: colors.textSecondary }]}>
        {language === 'ar' ? 'لا توجد خدمات بعد' : 'No services yet'}
      </Text>
      <Pressable
        onPress={() => router.push('/my-requests')}
        style={({ pressed }) => [styles.viewRequestsBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.viewRequestsBtnText}>
          {language === 'ar' ? 'عرض الطلبات' : 'View Requests'}
        </Text>
      </Pressable>
    </View>
  );
}

function LogoutButton() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { logout, isAuthenticated } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    logout();
    router.replace('/welcome');
  }, [logout, router]);

  if (!isAuthenticated) return null;

  return (
    <Pressable
      onPress={handleSignOut}
      style={({ pressed }) => [
        styles.logoutBtn,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        pressed && { opacity: 0.7 },
      ]}
    >
      <LogOut color={colors.destructive} size={16} strokeWidth={1.8} />
      <Text style={[styles.logoutText, { color: colors.destructive }]}>
        {language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
      </Text>
    </Pressable>
  );
}

export default function MoreScreen() {
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) { setStats(null); return; }
    try {
      const data = await trpcClient.users.stats.query();
      setStats(data);
      console.log('[Profile] fetched stats', data);
    } catch (err) {
      console.log('[Profile] stats error', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

  const userId = user?.id ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="profile-scroll"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
          }
        >
          <ProfileHeader stats={stats} />

          {isAuthenticated && (
            <>
              <ProfileTabs activeTab={activeTab} onSelect={setActiveTab} />
              <View style={styles.tabContent}>
                {activeTab === 0 ? <MyPostsList userId={userId} /> : null}
                {activeTab === 1 ? <ServicesTab /> : null}
              </View>
            </>
          )}

          <LogoutButton />

          <Text style={[styles.versionText, { color: colors.textMuted }]}>مُوسع v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, marginTop: 8 },
  profileTabItem: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 4, position: 'relative' as const },
  tabText: { fontSize: 12, fontWeight: '500' as const },
  tabIndicator: { position: 'absolute', bottom: -1, width: '60%', height: 2, borderRadius: 1 },
  tabContent: { minHeight: 100, paddingBottom: 16 },
  tabListContent: { paddingHorizontal: 16, gap: 10, paddingTop: 10 },
  emptyTab: { alignItems: 'center', paddingVertical: 44, gap: 10 },
  emptyTabIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyTabText: { fontSize: 13 },
  viewRequestsBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  viewRequestsBtnText: { color: '#FFF', fontSize: 13, fontWeight: '600' as const },
  postCard: { padding: 16, borderRadius: 14, gap: 8 },
  postContent: { fontSize: 15, lineHeight: 22 },
  topicBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  topicText: { fontSize: 11, fontWeight: '600' as const },
  postMeta: { gap: 14, alignItems: 'center', paddingTop: 4 },
  postMetaText: { fontSize: 12 },
  postMetaTime: { fontSize: 12 },
  logoutBtn: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16, marginTop: 16 },
  logoutText: { fontSize: 15, fontWeight: '500' as const },
  versionText: { fontSize: 12, textAlign: 'center' as const, marginTop: 16 },
});
