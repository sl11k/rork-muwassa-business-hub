import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
  Bookmark,
  Clock,
  Filter,
  Plus,
  Search,
  Star,
  ArrowRight,
} from 'lucide-react-native';

import { PressableScale } from '@/components/PressableScale';
import { Toast } from '@/components/Toast';
import { ServiceCardSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CATS_AR = ['الكل', 'حوكمة', 'استشارات', 'أمن سيبراني', 'تسويق'];
const CATS_EN = ['All', 'Governance', 'Consulting', 'Cybersecurity', 'Marketing'];
const CAT_KEYS_EN = ['', 'Governance', 'Consulting', 'Cybersecurity', 'Marketing'];

const AVATAR_COLORS = ['#D4A254', '#4A9FF5', '#FB7185', '#8B8DF8', '#22D3EE', '#F472B6'];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ServiceItem {
  id: string;
  ownerId: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  price: string;
  priceAr: string;
  delivery: string;
  deliveryAr: string;
  features: Array<{ en: string; ar: string }>;
  ownerName: string;
  ownerInitial: string;
  ownerRole: string;
  createdAt: string;
  updatedAt: string;
}

function Header({ onCreatePress, isAuthenticated }: { onCreatePress: () => void; isAuthenticated: boolean }) {
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
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
            {language === 'ar' ? 'السوق' : 'Market'}
          </Text>
          <Text style={[styles.headerSubtitle, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }]}>
            {language === 'ar' ? 'خدمات احترافية من خبراء معتمدين' : 'Professional services from verified experts'}
          </Text>
        </View>
        {isAuthenticated ? (
          <Pressable
            onPress={onCreatePress}
            style={({ pressed }) => [pressed && { opacity: 0.85, transform: [{ scale: 0.9 }] }]}
          >
            <LinearGradient
              colors={[colors.accent, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.addBtn}
            >
              <Plus color="#FFF" size={18} strokeWidth={2.5} />
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
      <View style={[styles.searchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Pressable style={({ pressed }) => [
          styles.searchBar,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
        ]}>
          <View style={[styles.searchIconWrap, { backgroundColor: colors.accentLight }]}>
            <Search color={colors.accent} size={14} strokeWidth={2.2} />
          </View>
          <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
            {language === 'ar' ? 'ابحث عن خدمة...' : 'Search services...'}
          </Text>
        </Pressable>
        <Pressable style={({ pressed }) => [
          styles.filterBtn,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          },
          pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] },
        ]}>
          <Filter color={colors.textSecondary} size={17} strokeWidth={1.8} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function CategoryTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const cats = language === 'ar' ? CATS_AR : CATS_EN;

  return (
    <FlatList
      horizontal
      inverted={isRTL}
      data={cats}
      keyExtractor={(item) => item}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catRow}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => {
            onSelect(index);
            void Haptics.selectionAsync();
          }}
          style={({ pressed }) => [
            styles.catPill,
            active === index
              ? { backgroundColor: colors.accent }
              : {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                },
            pressed && { transform: [{ scale: 0.93 }] },
          ]}
        >
          <Text style={[
            styles.catText,
            { color: active === index ? '#000' : colors.textSecondary },
            active === index && { fontWeight: '700' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

function FeaturedBanner() {
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
        <View style={styles.featuredInner}>
          <View style={[styles.featuredBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Star color="#FFF" size={11} fill="#FFF" />
            <Text style={styles.featuredBadgeText}>{language === 'ar' ? 'مميز' : 'Featured'}</Text>
          </View>
          <Text style={[styles.featuredTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'خدمات استشارية متميزة' : 'Premium Consulting'}
          </Text>
          <Text style={[styles.featuredDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
            {language === 'ar' ? 'من خبراء معتمدين في المنطقة' : 'From verified experts in the region'}
          </Text>
          <View style={[styles.featuredAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.featuredActionText}>
              {language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}
            </Text>
            <ArrowRight color="#FFF" size={14} strokeWidth={2} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const ServiceCard = React.memo(function ServiceCard({
  item,
  onRequest,
  onSave,
  requestedIds,
}: {
  item: ServiceItem;
  onRequest: (id: string, title: string) => void;
  onSave: () => void;
  requestedIds: Set<string>;
}) {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();
  const [saved, setSaved] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(30)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 120 }),
    ]).start();
  }, [fadeIn, slideIn]);

  const isRequested = requestedIds.has(item.id);
  const avatarColor = getAvatarColor(item.id);
  const title = language === 'ar' ? item.titleAr : item.title;
  const category = language === 'ar' ? item.categoryAr : item.category;
  const price = language === 'ar' ? item.priceAr : item.price;
  const delivery = language === 'ar' ? item.deliveryAr : item.delivery;

  const handleRequest = useCallback(() => {
    if (isRequested) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRequest(item.id, title);
  }, [isRequested, item.id, title, onRequest]);

  const handleSave = useCallback(() => {
    setSaved((v) => !v);
    Animated.sequence([
      Animated.spring(bookmarkScale, { toValue: 1.35, useNativeDriver: true, damping: 5, stiffness: 400 }),
      Animated.spring(bookmarkScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 280 }),
    ]).start();
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!saved) onSave();
  }, [saved, onSave, bookmarkScale]);

  return (
    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideIn }] }}>
      <PressableScale
        onPress={() => router.push(`/service/${item.id}`)}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? colors.bgCard : colors.white,
          },
        ]}
        haptic
        testID={`service-${item.id}`}
      >
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.providerAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.providerInitial}>{item.ownerInitial}</Text>
          </View>
          <View style={[styles.providerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.providerName, { color: colors.text }]}>{item.ownerName}</Text>
            <View style={[styles.catBadge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.catBadgeText, { color: colors.accent }]}>{category}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.ratingWrap, { backgroundColor: isDark ? 'rgba(251,191,36,0.10)' : 'rgba(194,120,3,0.08)' }]}>
              <Star color={colors.yellow} fill={colors.yellow} size={10} />
              <Text style={[styles.ratingText, { color: colors.text }]}>4.8</Text>
            </View>
            <Pressable onPress={handleSave} style={styles.saveBtn} hitSlop={8}>
              <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                <Bookmark
                  color={saved ? colors.accent : colors.textTertiary}
                  fill={saved ? colors.accent : 'transparent'}
                  size={16}
                  strokeWidth={1.8}
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {title}
        </Text>

        <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceText, { color: colors.accent }]}>{price}</Text>
            <View style={[styles.deliveryWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock color={colors.textTertiary} size={11} strokeWidth={2} />
              <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>{delivery}</Text>
            </View>
          </View>
          <Pressable
            onPress={handleRequest}
            style={({ pressed }) => [
              pressed && !isRequested && { opacity: 0.85, transform: [{ scale: 0.95 }] },
            ]}
          >
            {isRequested ? (
              <View style={[styles.requestedBtn, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.requestedText, { color: colors.accent }]}>
                  {language === 'ar' ? 'تم الطلب' : 'Requested'}
                </Text>
              </View>
            ) : (
              <LinearGradient
                colors={[colors.accent, colors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.requestBtn}
              >
                <Text style={styles.requestText}>
                  {language === 'ar' ? 'طلب' : 'Request'}
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>
      </PressableScale>
    </Animated.View>
  );
});

function LoadingSkeleton() {
  return (
    <View>
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
      <ServiceCardSkeleton />
    </View>
  );
}

export default function MarketplaceScreen() {
  const { language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [requestedIds] = useState<Set<string>>(new Set());

  const category = CAT_KEYS_EN[activeCat] || undefined;

  const servicesQuery = useQuery({
    queryKey: ['marketplace', 'list', category],
    queryFn: () => trpcClient.marketplace.list.query({ cursor: 0, limit: 20, category }),
  });

  const handleRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['marketplace', 'list'] });
  }, [queryClient]);

  const handleRequest = useCallback((serviceId: string, _title: string) => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      setToastVisible(true);
      return;
    }
    router.push(`/request-service?serviceId=${serviceId}` as never);
  }, [isAuthenticated, language, router]);

  const handleSave = useCallback(() => {
    setToastMsg(language === 'ar' ? 'تم حفظ الخدمة' : 'Service saved');
    setToastVisible(true);
  }, [language]);

  const handleCreatePress = useCallback(() => {
    if (!isAuthenticated) {
      setToastMsg(language === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      setToastVisible(true);
      return;
    }
    router.push('/create-service');
  }, [router, isAuthenticated, language]);

  const services = servicesQuery.data?.services ?? [];
  const isLoading = servicesQuery.isLoading;
  const isRefreshing = servicesQuery.isRefetching && !servicesQuery.isLoading;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {isLoading ? (
          <>
            <Header onCreatePress={handleCreatePress} isAuthenticated={isAuthenticated} />
            <CategoryTabs active={activeCat} onSelect={setActiveCat} />
            <LoadingSkeleton />
          </>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ServiceCard item={item as ServiceItem} onRequest={handleRequest} onSave={handleSave} requestedIds={requestedIds} />
            )}
            ListHeaderComponent={
              <>
                <Header onCreatePress={handleCreatePress} isAuthenticated={isAuthenticated} />
                <CategoryTabs active={activeCat} onSelect={setActiveCat} />
                <FeaturedBanner />
              </>
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Star color={colors.accent} size={24} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {language === 'ar' ? 'لا توجد خدمات حالياً' : 'No services available'}
                </Text>
                <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'جرّب تصنيفاً مختلفاً' : 'Try a different category'}
                </Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            testID="marketplace-list"
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
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
  headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 14 },
  headerRow: { alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1.2 },
  headerSubtitle: { fontSize: 15, fontWeight: '400' as const, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchRow: { gap: 8, alignItems: 'center' },
  searchBar: { flex: 1, alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18 },
  searchIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  filterBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  catRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  catPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24 },
  catText: { fontSize: 13, fontWeight: '600' as const },
  featuredBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderRadius: 22, overflow: 'hidden' },
  featuredGradient: { borderRadius: 22 },
  featuredInner: { padding: 22, gap: 8 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.2, color: '#FFF' },
  featuredTitle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, marginTop: 4, color: '#FFF' },
  featuredDesc: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.7)' },
  featuredAction: { alignItems: 'center', gap: 4, marginTop: 4 },
  featuredActionText: { fontSize: 14, fontWeight: '700' as const, letterSpacing: -0.1, color: '#FFF' },
  card: { marginHorizontal: 16, marginTop: 10, padding: 18, borderRadius: 20, gap: 14 },
  cardHeader: { alignItems: 'center', gap: 12 },
  providerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  providerInitial: { color: '#FFF', fontSize: 17, fontWeight: '800' as const },
  providerInfo: { flex: 1, gap: 5 },
  providerName: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  catBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 8 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 13, fontWeight: '800' as const },
  saveBtn: { padding: 2 },
  serviceTitle: { fontSize: 16, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.2 },
  cardFooter: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 14 },
  priceContainer: { flex: 1, gap: 4 },
  priceText: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  deliveryWrap: { alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: 12, fontWeight: '500' as const },
  requestBtn: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 16, alignItems: 'center' },
  requestText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  requestedBtn: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 16, alignItems: 'center' },
  requestedText: { fontSize: 14, fontWeight: '600' as const },
  emptyWrap: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, textAlign: 'center' as const },
});
