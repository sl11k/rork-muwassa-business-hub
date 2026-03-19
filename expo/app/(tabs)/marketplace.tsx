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

const AVATAR_COLORS = ['#00C9A7', '#FFB547', '#FB7185', '#818CF8', '#22D3EE', '#F472B6'];

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
      <LinearGradient
        colors={isDark ? ['rgba(255,181,71,0.06)', 'rgba(0,201,167,0.03)', 'transparent'] : ['rgba(255,181,71,0.04)', 'transparent']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
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
            backgroundColor: isDark ? colors.bgCard : colors.white,
          },
          pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
        ]}>
          <LinearGradient
            colors={['#FFB547', '#FFD080']}
            style={styles.searchIconWrap}
          >
            <Search color="#FFF" size={14} strokeWidth={2.2} />
          </LinearGradient>
          <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textTertiary }]}>
            {language === 'ar' ? 'ابحث عن خدمة...' : 'Search services...'}
          </Text>
        </Pressable>
        <Pressable style={({ pressed }) => [
          styles.filterBtn,
          { backgroundColor: isDark ? colors.bgCard : colors.white },
          pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
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
            { backgroundColor: isDark ? colors.bgCard : colors.white },
            active === index && styles.catPillActive,
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          {active === index ? (
            <LinearGradient
              colors={['#FFB547', '#FFD080']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          ) : null}
          <Text style={[
            styles.catText,
            { color: colors.textSecondary },
            active === index && { color: '#1A1A1F', fontWeight: '700' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

function FeaturedBanner() {
  const { isRTL, language } = useLanguage();
  useTheme();

  return (
    <View style={styles.featuredBanner}>
      <LinearGradient
        colors={['#FFB547', '#FFD080']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredInner}>
          <View style={[styles.featuredBadge, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
            <Star color="#1A1A1F" size={11} fill="#1A1A1F" />
            <Text style={[styles.featuredBadgeText, { color: '#1A1A1F' }]}>{language === 'ar' ? 'مميز' : 'Featured'}</Text>
          </View>
          <Text style={[styles.featuredTitle, { textAlign: isRTL ? 'right' : 'left', color: '#1A1A1F' }]}>
            {language === 'ar' ? 'خدمات استشارية متميزة' : 'Premium Consulting'}
          </Text>
          <Text style={[styles.featuredDesc, { textAlign: isRTL ? 'right' : 'left', color: 'rgba(26,26,31,0.7)' }]}>
            {language === 'ar' ? 'من خبراء معتمدين في المنطقة' : 'From verified experts in the region'}
          </Text>
          <View style={[styles.featuredAction, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.featuredActionText, { color: '#1A1A1F' }]}>
              {language === 'ar' ? 'تصفح الخدمات' : 'Browse Services'}
            </Text>
            <ArrowRight color="#1A1A1F" size={14} strokeWidth={2} style={isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
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
          { backgroundColor: isDark ? colors.bgCard : colors.white },
        ]}
        haptic
        testID={`service-${item.id}`}
      >
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <LinearGradient
            colors={[avatarColor, avatarColor + 'BB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.providerAvatar}
          >
            <Text style={styles.providerInitial}>{item.ownerInitial}</Text>
          </LinearGradient>
          <View style={[styles.providerInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.providerName, { color: colors.text }]}>{item.ownerName}</Text>
            <View style={[styles.catBadge, { backgroundColor: colors.accentLight }]}>
              <Text style={[styles.catBadgeText, { color: colors.accent }]}>{category}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.ratingWrap, { backgroundColor: colors.yellowLight }]}>
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

        <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row', borderTopColor: isDark ? colors.border : colors.separator }]}>
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
              pressed && !isRequested && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
          >
            {isRequested ? (
              <View style={[styles.requestedBtn, { backgroundColor: colors.accentLight }]}>
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
                <LinearGradient
                  colors={[colors.accentSoft, colors.accentSoft2]}
                  style={styles.emptyIconOuter}
                >
                  <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentLight }]}>
                    <Star color={colors.accent} size={24} strokeWidth={1.5} />
                  </View>
                </LinearGradient>
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
  headerWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, gap: 14, overflow: 'hidden' },
  headerGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  headerRow: { alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1.5 },
  headerSubtitle: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1, marginTop: 2 },
  addBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  searchRow: { gap: 8, alignItems: 'center' },
  searchBar: { flex: 1, alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 13, borderRadius: 20 },
  searchIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1, fontSize: 14, letterSpacing: -0.2 },
  filterBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  catRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14 },
  catPill: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 20, overflow: 'hidden' },
  catPillActive: {},
  catText: { fontSize: 13, fontWeight: '600' as const },
  featuredBanner: { marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderRadius: 22, overflow: 'hidden' },
  featuredGradient: { borderRadius: 22 },
  featuredInner: { padding: 22, gap: 8 },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  featuredBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.2 },
  featuredTitle: { fontSize: 20, fontWeight: '800' as const, letterSpacing: -0.4, marginTop: 4 },
  featuredDesc: { fontSize: 14, lineHeight: 21 },
  featuredAction: { alignItems: 'center', gap: 4, marginTop: 4 },
  featuredActionText: { fontSize: 14, fontWeight: '700' as const, letterSpacing: -0.1 },
  card: { marginHorizontal: 16, marginTop: 12, padding: 18, borderRadius: 22, gap: 14 },
  cardHeader: { alignItems: 'center', gap: 12 },
  providerAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  providerInitial: { color: '#FFF', fontSize: 16, fontWeight: '800' as const },
  providerInfo: { flex: 1, gap: 5 },
  providerName: { fontSize: 15, fontWeight: '700' as const, letterSpacing: -0.2 },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  catBadgeText: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.1 },
  cardHeaderRight: { alignItems: 'flex-end', gap: 8 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  ratingText: { fontSize: 13, fontWeight: '800' as const },
  saveBtn: { padding: 2 },
  serviceTitle: { fontSize: 17, fontWeight: '700' as const, lineHeight: 25, letterSpacing: -0.2 },
  cardFooter: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1 },
  priceContainer: { flex: 1, gap: 4 },
  priceText: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.3 },
  deliveryWrap: { alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: 12, fontWeight: '500' as const },
  requestBtn: { paddingHorizontal: 26, paddingVertical: 11, borderRadius: 16, alignItems: 'center' },
  requestText: { color: '#FFF', fontSize: 14, fontWeight: '700' as const },
  requestedBtn: { paddingHorizontal: 26, paddingVertical: 11, borderRadius: 16, alignItems: 'center' },
  requestedText: { fontSize: 14, fontWeight: '600' as const },
  emptyWrap: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 },
  emptyIconOuter: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.3 },
  emptyDesc: { fontSize: 14, textAlign: 'center' as const },
});
