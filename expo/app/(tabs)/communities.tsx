import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  Crown,
  Globe,
  Lock,
  Search,
  Sparkles,
  Users,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { CommunityCardSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CommunityItem {
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
  createdAt: string;
}

const FILTERS_AR = ['الكل', 'عام', 'خاص', 'مميز'];
const FILTERS_EN = ['All', 'Public', 'Private', 'Premium'];

const PRIVACY_LABELS: Record<string, Record<string, string>> = {
  public: { ar: 'عام', en: 'Public' },
  private: { ar: 'خاص', en: 'Private' },
  premium: { ar: 'مميز', en: 'Premium' },
};

function Header() {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 110 }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View style={[styles.headerWrap, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
        {language === 'ar' ? 'المجتمعات' : 'Communities'}
      </Text>
      <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
        {language === 'ar' ? 'اكتشف مجتمعات تناسب اهتماماتك' : 'Find communities that match your interests'}
      </Text>
      <Pressable style={({ pressed }) => [
        styles.searchBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: isDark ? colors.bgCard : colors.white,
          borderWidth: 1,
          borderColor: isDark ? colors.border : colors.separator,
        },
        pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
      ]}>
        <View style={[styles.searchIconWrap, { backgroundColor: colors.accent }]}>
          <Search color="#1C1C1E" size={14} strokeWidth={2.2} />
        </View>
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
          {language === 'ar' ? 'ابحث عن مجتمع...' : 'Search communities...'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const filters = language === 'ar' ? FILTERS_AR : FILTERS_EN;

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={filters}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.filterRow}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => {
            onSelect(index);
            void Haptics.selectionAsync();
          }}
          style={({ pressed }) => [
            styles.filterPill,
            {
              backgroundColor: active === index
                ? colors.accent
                : (isDark ? colors.bgCard : colors.white),
              borderWidth: active === index ? 0 : 1,
              borderColor: isDark ? colors.border : colors.separator,
            },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <Text style={[
            styles.filterText,
            { color: active === index ? '#1C1C1E' : colors.textSecondary },
            active === index && { fontWeight: '700' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

function FeaturedCommunityBanner() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.featuredBanner}>
      <LinearGradient
        colors={[colors.accent, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          <View style={[styles.featuredBadge, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
            <Sparkles color="#1C1C1E" size={12} strokeWidth={2.2} />
            <Text style={[styles.featuredBadgeText, { color: '#1C1C1E' }]}>{language === 'ar' ? 'جديد' : 'New'}</Text>
          </View>
          <Text style={[styles.featuredTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'مجتمعات جديدة هذا الأسبوع' : 'New communities this week'}
          </Text>
          <Text style={[styles.featuredDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'اكتشف مجتمعات تناسب اهتماماتك المهنية' : 'Discover communities that match your interests'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function MemberAvatarStack({ count }: { count: number }) {
  const { colors, isDark } = useTheme();
  const avatarColors = ['#E8A838', '#4A9FF5', '#818CF8', '#FB7185'];
  return (
    <View style={styles.avatarStack}>
      {avatarColors.slice(0, Math.min(3, count)).map((c, i) => (
        <View key={i} style={[styles.stackAvatar, { backgroundColor: c, marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i, borderColor: isDark ? colors.bgCard : colors.white }]} />
      ))}
      <Text style={[styles.stackCount, { color: colors.textSecondary }]}>{count}</Text>
    </View>
  );
}

const CommunityCard = React.memo(function CommunityCard({
  item,
  onJoinToggle,
  isJoining,
}: {
  item: CommunityItem;
  onJoinToggle: (id: string, isMember: boolean) => void;
  isJoining: boolean;
}) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(30)).current;
  const displayName = language === 'ar' ? item.nameAr : item.name;
  const displayDesc = language === 'ar' ? item.descriptionAr : item.description;
  const privacyLabel = PRIVACY_LABELS[item.privacy]?.[language] ?? item.privacy;
  const isPremium = item.privacy === 'premium';
  const isPrivate = item.privacy === 'private';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, [fadeIn, slideIn]);

  const handleJoin = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onJoinToggle(item.id, item.isMember);
  }, [item.id, item.isMember, onJoinToggle]);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideIn }] }}>
      <PressableScale
        onPress={() => router.push(`/community/${item.id}`)}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.bgCard : colors.white,
            borderWidth: 1,
            borderColor: isDark ? colors.border : colors.separator,
          },
        ]}
        haptic
        testID={`community-${item.id}`}
      >
        <View style={[styles.cardAccentBar, { backgroundColor: item.accent }]} />
        <View style={styles.cardBody}>
          <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardIcon, { backgroundColor: item.accent + '18' }]}>
              <Text style={styles.cardEmoji}>{item.icon}</Text>
            </View>
            <View style={[styles.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]} numberOfLines={2}>
                {displayDesc}
              </Text>
            </View>
          </View>

          <View style={[styles.cardBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.statRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <MemberAvatarStack count={item.memberCount} />
              <View style={[
                styles.privacyBadge,
                isPremium && { backgroundColor: colors.orangeLight },
                isPrivate && { backgroundColor: colors.cyanLight },
                !isPremium && !isPrivate && { backgroundColor: colors.tealLight },
              ]}>
                {isPremium ? <Crown color={colors.orange} size={10} /> : isPrivate ? <Lock color={colors.cyan} size={10} /> : <Globe color={colors.teal} size={10} />}
                <Text style={[
                  styles.privacyText,
                  isPremium && { color: colors.orange },
                  isPrivate && { color: colors.cyan },
                  !isPremium && !isPrivate && { color: colors.teal },
                ]}>
                  {privacyLabel}
                </Text>
              </View>
            </View>
            {item.isMember ? (
              <View style={[styles.joinedBtn, { backgroundColor: colors.accentLight }]}>
                <Users color={colors.accent} size={12} strokeWidth={2} />
                <Text style={[styles.joinedText, { color: colors.accent }]}>
                  {language === 'ar' ? 'عضو' : 'Joined'}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleJoin}
                style={({ pressed }) => [
                  pressed && !isJoining && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                ]}
                disabled={isJoining}
              >
                {isJoining ? (
                  <View style={[styles.joinBtn, { backgroundColor: colors.accent }]}>
                    <ActivityIndicator size="small" color="#1C1C1E" />
                  </View>
                ) : (
                  <View style={[styles.joinBtn, { backgroundColor: colors.accent }]}>
                    <Text style={styles.joinText}>{language === 'ar' ? 'انضم' : 'Join'}</Text>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

function LoadingSkeleton() {
  return (
    <View>
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
      <CommunityCardSkeleton />
    </View>
  );
}

export default function CommunitiesScreen() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const filterMap: Record<number, 'public' | 'private' | 'premium' | undefined> = {
    0: undefined,
    1: 'public',
    2: 'private',
    3: 'premium',
  };

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list', filterMap[activeFilter]],
    queryFn: () => trpcClient.communities.list.query({ filter: filterMap[activeFilter] }),
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return trpcClient.communities.join.mutate({ communityId });
    },
    onSuccess: (_data, communityId) => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      const community = communitiesQuery.data?.find((c: CommunityItem) => c.id === communityId);
      const name = language === 'ar' ? (community?.nameAr ?? '') : (community?.name ?? '');
      setToastMsg(language === 'ar' ? `انضممت إلى ${name}` : `Joined ${name}`);
      setToastVisible(true);
      setJoiningId(null);
      console.log('[Communities] joined community, group chat created by API');
    },
    onError: () => { setJoiningId(null); },
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => {
      return trpcClient.communities.leave.mutate({ communityId });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      setJoiningId(null);
    },
    onError: () => { setJoiningId(null); },
  });

  const handleJoinToggle = useCallback((communityId: string, isMember: boolean) => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'سجّل الدخول أولاً' : 'Please log in first');
      setToastVisible(true);
      return;
    }
    setJoiningId(communityId);
    if (isMember) {
      leaveMutation.mutate(communityId);
    } else {
      joinMutation.mutate(communityId);
    }
  }, [isAuthenticated, language, joinMutation, leaveMutation]);

  const handleRefresh = useCallback(() => {
    void communitiesQuery.refetch();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [communitiesQuery]);

  const communities = communitiesQuery.data ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {communitiesQuery.isLoading ? (
          <>
            <Header />
            <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
            <LoadingSkeleton />
          </>
        ) : (
          <FlatList
            data={communities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommunityCard item={item} onJoinToggle={handleJoinToggle} isJoining={joiningId === item.id} />
            )}
            ListHeaderComponent={
              <>
                <Header />
                <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
                <FeaturedCommunityBanner />
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Users color={colors.accent} size={24} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {language === 'ar' ? 'لا توجد مجتمعات' : 'No communities found'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'جرّب تصنيفاً مختلفاً' : 'Try a different filter'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="communities-list"
            refreshControl={
              <RefreshControl refreshing={communitiesQuery.isRefetching} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
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
  listContent: { paddingBottom: 100, flexGrow: 1 },
  headerWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, gap: 10 },
  headerTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1 },
  headerSubtitle: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, marginBottom: 4 },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16 },
  searchIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: '600' as const },
  featuredBanner: { marginHorizontal: 16, marginBottom: 8, borderRadius: 18, overflow: 'hidden' },
  featuredGradient: { borderRadius: 18 },
  featuredContent: { padding: 20, gap: 8 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.2 },
  featuredTitle: { fontSize: 19, fontWeight: '800' as const, letterSpacing: -0.4, color: '#1C1C1E' },
  featuredDesc: { fontSize: 13, lineHeight: 20, color: 'rgba(28,28,30,0.7)' },
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 18, overflow: 'hidden' },
  cardAccentBar: { height: 3 },
  cardBody: { padding: 16, gap: 14 },
  cardTop: { gap: 12, alignItems: 'flex-start' },
  cardIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  cardEmoji: { fontSize: 24 },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { fontSize: 16, fontWeight: '700' as const, letterSpacing: -0.3 },
  cardDesc: { fontSize: 13, lineHeight: 19 },
  cardBottom: { alignItems: 'center', justifyContent: 'space-between' },
  statRow: { alignItems: 'center', gap: 10 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackAvatar: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5 },
  stackCount: { fontSize: 13, fontWeight: '700' as const, marginLeft: 6 },
  privacyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  privacyText: { fontSize: 11, fontWeight: '700' as const },
  joinBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  joinText: { color: '#1C1C1E', fontSize: 14, fontWeight: '700' as const },
  joinedBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 18, paddingVertical: 9, borderRadius: 14 },
  joinedText: { fontSize: 13, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10, minHeight: 200 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14 },
});
