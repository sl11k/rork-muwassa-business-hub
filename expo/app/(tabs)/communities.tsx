import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Bookmark,
  Crown,
  Globe,
  Heart,
  Lock,
  MessageCircle,
  Plus,
  Search,
  ShoppingBag,
  TrendingUp,
  Users,
  X,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { CommunityCardSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import {
  getLocalizedText,
  trendingTopics,
  expertSuggestions,
  communities as mockCommunities,
  services as mockServices,
  feedPosts,
} from '@/data/businessHub';
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

const DISCOVER_TABS_AR = ['الكل', 'مجتمعات', 'خبراء', 'خدمات', 'منشورات'];
const DISCOVER_TABS_EN = ['All', 'Communities', 'Experts', 'Services', 'Posts'];

function Header({ searchText, onSearchChange, onClear }: { searchText: string; onSearchChange: (t: string) => void; onClear: () => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {language === 'ar' ? 'اكتشف' : 'Discover'}
        </Text>
        {isAuthenticated && (
          <Pressable
            onPress={() => router.push('/create-community' as any)}
            style={({ pressed }) => [styles.createBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          >
            <Plus color="#FFF" size={16} strokeWidth={2} />
          </Pressable>
        )}
      </View>
      <View style={[
        styles.searchBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}>
        <Search color={colors.textMuted} size={17} strokeWidth={1.5} />
        <TextInput
          value={searchText}
          onChangeText={onSearchChange}
          placeholder={language === 'ar' ? 'ابحث عن مجتمعات، خبراء، خدمات...' : 'Search communities, experts, services...'}
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}
        />
        {searchText.length > 0 && (
          <Pressable onPress={onClear} hitSlop={8}>
            <X color={colors.textMuted} size={16} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DiscoverTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const tabs = language === 'ar' ? DISCOVER_TABS_AR : DISCOVER_TABS_EN;

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={tabs}
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

function TrendingSection() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row', paddingHorizontal: 16 }]}>
        <TrendingUp color={colors.error} size={16} strokeWidth={2} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'ar' ? 'رائج الآن' : 'Trending'}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {trendingTopics.slice(0, 5).map((topic) => (
          <View key={topic.id} style={[styles.trendChip, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}>
            <Text style={[styles.trendText, { color: colors.textSecondary }]}>{getLocalizedText(topic.label, language)}</Text>
            {topic.isHot && <View style={[styles.hotDot, { backgroundColor: colors.error }]} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ExpertsSection() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16, color: colors.text }]}>
        {language === 'ar' ? 'خبراء بارزون' : 'Top Experts'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {expertSuggestions.map((expert) => (
          <Pressable
            key={expert.id}
            onPress={() => router.push(`/user/${expert.id}`)}
            style={({ pressed }) => [styles.expertCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <View style={[styles.expertAvatar, { backgroundColor: expert.avatarColor }]}>
              <Text style={styles.expertInitial}>{expert.nameInitial}</Text>
            </View>
            <Text style={[styles.expertName, { color: colors.text }]} numberOfLines={1}>{expert.name}</Text>
            <Text style={[styles.expertRole, { color: colors.textMuted }]} numberOfLines={1}>{getLocalizedText(expert.role, language)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ServicesSection() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16, color: colors.text }]}>
        {language === 'ar' ? 'خدمات مقترحة' : 'Recommended Services'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
        {mockServices.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => router.push(`/service/${s.id}`)}
            style={({ pressed }) => [styles.serviceCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.serviceTitle, { color: colors.text }]} numberOfLines={2}>{getLocalizedText(s.title, language)}</Text>
            <Text style={[styles.servicePrice, { color: colors.accent }]}>{getLocalizedText(s.price, language)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function PopularPostsSection() {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 16, color: colors.text }]}>
        {language === 'ar' ? 'منشورات شائعة' : 'Popular Posts'}
      </Text>
      {feedPosts.slice(0, 3).map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push(`/post/${post.id}`)}
          style={({ pressed }) => [styles.postCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
        >
          <View style={[styles.postTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.postAvatar, { backgroundColor: post.avatarColor }]}>
              <Text style={styles.postAvatarText}>{post.authorInitial}</Text>
            </View>
            <View style={{ flex: 1, gap: 2, alignItems: isRTL ? 'flex-end' as const : 'flex-start' as const }}>
              <Text style={[styles.postAuthor, { color: colors.text }]}>{post.author}</Text>
              <Text style={[styles.postRole, { color: colors.textMuted }]}>{getLocalizedText(post.role, language)}</Text>
            </View>
          </View>
          <Text style={[styles.postContent, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]} numberOfLines={2}>
            {getLocalizedText(post.content, language)}
          </Text>
        </Pressable>
      ))}
    </View>
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
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeIn]);

  const displayName = language === 'ar' ? item.nameAr : item.name;
  const displayDesc = language === 'ar' ? item.descriptionAr : item.description;

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
            {item.privacy === 'private' && <Lock color={colors.textMuted} size={11} strokeWidth={1.5} />}
            {item.privacy === 'premium' && <Crown color={colors.textMuted} size={11} strokeWidth={1.5} />}
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

  const hasSearch = searchText.trim().length > 0;

  const filterMap: Record<number, 'public' | 'private' | 'premium' | undefined> = {
    0: undefined, 1: undefined, 2: undefined, 3: undefined, 4: undefined,
  };

  const communitiesQuery = useQuery({
    queryKey: ['communities', 'list'],
    queryFn: () => trpcClient.communities.list.query({}),
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

  const filteredCommunities = communities.filter((c: CommunityItem) => {
    if (hasSearch) {
      const q = searchText.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.nameAr.includes(q) || c.description.toLowerCase().includes(q) || c.descriptionAr.includes(q);
    }
    return true;
  });

  const showDiscoverSections = !hasSearch && activeFilter === 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {communitiesQuery.isLoading ? (
          <>
            <Header searchText={searchText} onSearchChange={setSearchText} onClear={() => setSearchText('')} />
            <DiscoverTabs active={activeFilter} onSelect={setActiveFilter} />
            <View>
              <CommunityCardSkeleton />
              <CommunityCardSkeleton />
              <CommunityCardSkeleton />
            </View>
          </>
        ) : (
          <FlatList
            data={(!hasSearch && (activeFilter === 2 || activeFilter === 3 || activeFilter === 4)) ? [] : filteredCommunities}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CommunityRow item={item} onJoinToggle={handleJoinToggle} isJoining={joiningId === item.id} />
            )}
            ListHeaderComponent={
              <>
                <Header searchText={searchText} onSearchChange={setSearchText} onClear={() => setSearchText('')} />
                <DiscoverTabs active={activeFilter} onSelect={setActiveFilter} />
                {showDiscoverSections && (
                  <>
                    <TrendingSection />
                    <ExpertsSection />
                    <ServicesSection />
                    <PopularPostsSection />
                    <View style={[styles.communitiesLabel, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 }]}>
                      <Users color={colors.accent} size={16} strokeWidth={2} />
                      <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        {language === 'ar' ? 'المجتمعات' : 'Communities'}
                      </Text>
                    </View>
                  </>
                )}
                {!hasSearch && activeFilter === 2 && <ExpertsSection />}
                {!hasSearch && activeFilter === 3 && <ServicesSection />}
                {!hasSearch && activeFilter === 4 && <PopularPostsSection />}
              </>
            }
            ListEmptyComponent={
              (activeFilter === 1 || hasSearch) ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentLight }]}>
                    <Users color={colors.accent} size={24} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
                  </Text>
                  <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                    {language === 'ar' ? 'جرّب كلمات بحث مختلفة' : 'Try different search terms'}
                  </Text>
                </View>
              ) : null
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
  listContent: { paddingBottom: 120, flexGrow: 1 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 12 },
  headerTopRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  createBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 14 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterPill: { paddingHorizontal: 16, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '500' as const },
  section: { paddingTop: 16, paddingBottom: 8, gap: 10 },
  sectionHeader: { alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const },
  trendChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  trendText: { fontSize: 13, fontWeight: '500' as const },
  hotDot: { width: 5, height: 5, borderRadius: 2.5 },
  expertCard: { width: 120, alignItems: 'center', gap: 6, padding: 14, borderRadius: 14 },
  expertAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  expertInitial: { color: '#FFF', fontSize: 16, fontWeight: '700' as const },
  expertName: { fontSize: 13, fontWeight: '600' as const, textAlign: 'center' as const },
  expertRole: { fontSize: 11, textAlign: 'center' as const },
  serviceCard: { width: 180, padding: 14, borderRadius: 14, gap: 8 },
  serviceTitle: { fontSize: 13, fontWeight: '600' as const, lineHeight: 19 },
  servicePrice: { fontSize: 14, fontWeight: '700' as const },
  postCard: { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 14, gap: 8 },
  postTop: { alignItems: 'center', gap: 10 },
  postAvatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { color: '#FFF', fontSize: 12, fontWeight: '700' as const },
  postAuthor: { fontSize: 14, fontWeight: '600' as const },
  postRole: { fontSize: 11 },
  postContent: { fontSize: 13, lineHeight: 20 },
  communitiesLabel: { paddingTop: 20, paddingBottom: 4 },
  communityRow: { alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowContent: { flex: 1, gap: 3 },
  rowName: { fontSize: 15, fontWeight: '600' as const },
  rowDesc: { fontSize: 13 },
  rowMeta: { alignItems: 'center', gap: 4 },
  rowMetaText: { fontSize: 12 },
  rowMetaDot: { fontSize: 12 },
  rowSeparator: { height: 1, marginLeft: 74 },
  joinedPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  joinedPillText: { fontSize: 13, fontWeight: '600' as const },
  joinPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  joinPillText: { color: '#FFF', fontSize: 13, fontWeight: '600' as const },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10, minHeight: 200 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' as const },
  emptyDesc: { fontSize: 13 },
});
