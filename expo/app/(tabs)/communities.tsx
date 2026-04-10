import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Crown,
  Globe,
  Lock,
  Search,
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

function Header({ searchText, onSearchChange }: { searchText: string; onSearchChange: (t: string) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.headerWrap}>
      <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
        {language === 'ar' ? 'اكتشف' : 'Discover'}
      </Text>
      <View style={[
        styles.searchBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}>
        <Search color={colors.textMuted} size={18} strokeWidth={1.5} />
        <TextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder={language === 'ar' ? 'ابحث عن مجتمع...' : 'Search communities...'}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
        />
      </View>
    </View>
  );
}

function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
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
          onPress={() => { onSelect(index); void Haptics.selectionAsync(); }}
          style={({ pressed }) => [
            styles.filterPill,
            active === index
              ? { backgroundColor: colors.accent }
              : { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
            pressed && { transform: [{ scale: 0.93 }] },
          ]}
        >
          <Text style={[
            styles.filterText,
            { color: active === index ? '#FFF' : colors.textMuted },
            active === index && { fontWeight: '600' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

function FeaturedSection({ communities, onJoinToggle, joiningId }: { communities: CommunityItem[]; onJoinToggle: (id: string, isMember: boolean) => void; joiningId: string | null }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const featured = communities.filter(c => c.memberCount > 5);

  if (featured.length === 0) return null;

  return (
    <View style={styles.featuredSection}>
      <Text style={[styles.featuredTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text, paddingHorizontal: 16 }]}>
        {language === 'ar' ? 'مميزة' : 'Featured'}
      </Text>
      <FlatList
        horizontal
        inverted={isRTL}
        data={featured.slice(0, 5)}
        keyExtractor={(item) => item.id + '-featured'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => {
          const displayName = language === 'ar' ? item.nameAr : item.name;
          return (
            <FeaturedCard item={item} displayName={displayName} onJoinToggle={onJoinToggle} isJoining={joiningId === item.id} />
          );
        }}
      />
    </View>
  );
}

function FeaturedCard({ item, displayName, onJoinToggle, isJoining }: { item: CommunityItem; displayName: string; onJoinToggle: (id: string, isMember: boolean) => void; isJoining: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={() => router.push(`/community/${item.id}`)}
      style={[styles.featuredCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
      haptic
    >
      <View style={[styles.featuredIcon, { backgroundColor: colors.accentLight }]}>
        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
      </View>
      <Text style={[styles.featuredName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
      <Text style={[styles.featuredMembers, { color: colors.textMuted }]}>{item.memberCount} {language === 'ar' ? 'عضو' : 'members'}</Text>
      {item.isMember ? (
        <View style={[styles.memberBadge, { backgroundColor: colors.accentLight }]}>
          <Text style={[styles.memberBadgeText, { color: colors.accent }]}>{language === 'ar' ? 'عضو' : 'Joined'}</Text>
        </View>
      ) : (
        <Pressable
          onPress={() => onJoinToggle(item.id, item.isMember)}
          disabled={isJoining}
          style={({ pressed }) => [styles.joinSmallBtn, { backgroundColor: colors.accentLight }, pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.joinSmallText, { color: colors.accent }]}>{language === 'ar' ? 'انضمام' : 'Join'}</Text>
        </Pressable>
      )}
    </PressableScale>
  );
}

const CommunityRow = React.memo(function CommunityRow({
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
  const { colors } = useTheme();
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeIn]);

  const displayName = language === 'ar' ? item.nameAr : item.name;
  const displayDesc = language === 'ar' ? item.descriptionAr : item.description;
  const privacyLabel = PRIVACY_LABELS[item.privacy]?.[language] ?? item.privacy;
  const isPremium = item.privacy === 'premium';
  const isPrivate = item.privacy === 'private';

  return (
    <Animated.View style={{ opacity: fadeIn }}>
      <Pressable
        onPress={() => router.push(`/community/${item.id}`)}
        style={({ pressed }) => [
          styles.communityRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
          pressed && { opacity: 0.7 },
        ]}
        testID={`community-${item.id}`}
      >
        <View style={[styles.rowIcon, { backgroundColor: item.accent + '14' }]}>
          <Text style={{ fontSize: 22 }}>{item.icon}</Text>
        </View>
        <View style={[styles.rowContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
          <Text style={[styles.rowDesc, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]} numberOfLines={1}>{displayDesc}</Text>
          <View style={[styles.rowMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>{item.memberCount} {language === 'ar' ? 'عضو' : 'members'}</Text>
            <Text style={[styles.rowMetaDot, { color: colors.textMuted }]}>·</Text>
            <Text style={[styles.rowMetaText, { color: colors.textMuted }]}>{item.postCount} {language === 'ar' ? 'منشور' : 'posts'}</Text>
          </View>
        </View>
        {item.isMember ? (
          <View style={[styles.joinedPill, { backgroundColor: colors.accentLight }]}>
            <Text style={[styles.joinedPillText, { color: colors.accent }]}>{language === 'ar' ? 'عضو' : 'Joined'}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onJoinToggle(item.id, item.isMember); }}
            disabled={isJoining}
            style={({ pressed }) => [styles.joinPill, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          >
            {isJoining ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.joinPillText}>{language === 'ar' ? 'انضم' : 'Join'}</Text>
            )}
          </Pressable>
        )}
      </Pressable>
      <View style={[styles.rowSeparator, { backgroundColor: colors.border }]} />
    </Animated.View>
  );
});

function LoadingSkeleton() {
  return (
    <View>
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
  const [searchText, setSearchText] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const filterMap: Record<number, 'public' | 'private' | 'premium' | undefined> = {
    0: undefined, 1: 'public', 2: 'private', 3: 'premium',
  };

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list', filterMap[activeFilter]],
    queryFn: () => trpcClient.communities.list.query({ filter: filterMap[activeFilter] }),
  });

  const joinMutation = useMutation({
    mutationFn: async (communityId: string) => trpcClient.communities.join.mutate({ communityId }),
    onSuccess: (_data, communityId) => {
      void queryClient.invalidateQueries({ queryKey: ['communities'] });
      const community = communitiesQuery.data?.find((c: CommunityItem) => c.id === communityId);
      const name = language === 'ar' ? (community?.nameAr ?? '') : (community?.name ?? '');
      setToastMsg(language === 'ar' ? `انضممت إلى ${name}` : `Joined ${name}`);
      setToastVisible(true);
      setJoiningId(null);
    },
    onError: () => { setJoiningId(null); },
  });

  const leaveMutation = useMutation({
    mutationFn: async (communityId: string) => trpcClient.communities.leave.mutate({ communityId }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['communities'] }); setJoiningId(null); },
    onError: () => { setJoiningId(null); },
  });

  const handleJoinToggle = useCallback((communityId: string, isMember: boolean) => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'سجّل الدخول أولاً' : 'Please log in first');
      setToastVisible(true);
      return;
    }
    setJoiningId(communityId);
    if (isMember) { leaveMutation.mutate(communityId); } else { joinMutation.mutate(communityId); }
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
            <Header searchText={searchText} onSearchChange={setSearchText} />
            <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
            <LoadingSkeleton />
          </>
        ) : (
          <FlatList
            data={communities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommunityRow item={item} onJoinToggle={handleJoinToggle} isJoining={joiningId === item.id} />
            )}
            ListHeaderComponent={
              <>
                <Header searchText={searchText} onSearchChange={setSearchText} />
                <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
                <FeaturedSection communities={communities} onJoinToggle={handleJoinToggle} joiningId={joiningId} />
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
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700' as const },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 12 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterPill: { paddingHorizontal: 16, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '500' as const },
  featuredSection: { paddingBottom: 16, gap: 10 },
  featuredTitle: { fontSize: 17, fontWeight: '600' as const },
  featuredCard: { width: 200, padding: 14, borderRadius: 12, alignItems: 'center', gap: 8 },
  featuredIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  featuredName: { fontSize: 15, fontWeight: '600' as const, textAlign: 'center' as const },
  featuredMembers: { fontSize: 12 },
  memberBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  memberBadgeText: { fontSize: 12, fontWeight: '600' as const },
  joinSmallBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  joinSmallText: { fontSize: 12, fontWeight: '600' as const },
  communityRow: { alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: '600' as const },
  rowDesc: { fontSize: 13 },
  rowMeta: { alignItems: 'center', gap: 4 },
  rowMetaText: { fontSize: 12 },
  rowMetaDot: { fontSize: 12 },
  rowSeparator: { height: 1, marginLeft: 74 },
  joinedPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  joinedPillText: { fontSize: 13, fontWeight: '600' as const },
  joinPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  joinPillText: { color: '#FFF', fontSize: 13, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10, minHeight: 200 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' as const },
  emptyDesc: { fontSize: 13 },
});
