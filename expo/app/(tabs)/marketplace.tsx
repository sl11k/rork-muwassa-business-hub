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
import {
  Bookmark,
  Clock,
  Plus,
  Search,
  Star,
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

const AVATAR_COLORS = ['#0D9488', '#4A9FF5', '#FB7185', '#818CF8', '#22D3EE', '#F472B6'];

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
  const { colors } = useTheme();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {language === 'ar' ? 'السوق' : 'Market'}
        </Text>
        {isAuthenticated ? (
          <Pressable
            onPress={onCreatePress}
            style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          >
            <Plus color="#FFF" size={18} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
      <Pressable style={[
        styles.searchBar,
        {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
        },
      ]}>
        <Search color={colors.textMuted} size={17} strokeWidth={1.5} />
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
          {language === 'ar' ? 'ابحث عن خدمة...' : 'Search services...'}
        </Text>
      </Pressable>
    </View>
  );
}

function CategoryTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
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
          onPress={() => { onSelect(index); void Haptics.selectionAsync(); }}
          style={({ pressed }) => [
            styles.catPill,
            active === index
              ? { backgroundColor: colors.accent }
              : { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
            pressed && { transform: [{ scale: 0.93 }] },
          ]}
        >
          <Text style={[
            styles.catText,
            { color: active === index ? '#FFF' : colors.textMuted },
            active === index && { fontWeight: '600' as const },
          ]}>{item}</Text>
        </Pressable>
      )}
    />
  );
}

function FeaturedSection({ services }: { services: ServiceItem[] }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const featured = services.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <View style={styles.featuredSection}>
      <Text style={[styles.featuredSectionTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text, paddingHorizontal: 16 }]}>
        {language === 'ar' ? 'مميزة' : 'Featured'}
      </Text>
      <FlatList
        horizontal
        inverted={isRTL}
        data={featured}
        keyExtractor={(item) => item.id + '-feat'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => {
          const title = language === 'ar' ? item.titleAr : item.title;
          const category = language === 'ar' ? item.categoryAr : item.category;
          const price = language === 'ar' ? item.priceAr : item.price;
          const avatarColor = getAvatarColor(item.id);

          return (
            <PressableScale
              onPress={() => router.push(`/service/${item.id}`)}
              style={[styles.featuredCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
              haptic
            >
              <View style={[styles.featCatBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.featCatText, { color: colors.accent }]}>{category}</Text>
              </View>
              <Text style={[styles.featTitle, { color: colors.text }]} numberOfLines={2}>{title}</Text>
              <View style={[styles.featProvider, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.featAvatar, { backgroundColor: avatarColor }]}>
                  <Text style={styles.featAvatarText}>{item.ownerInitial}</Text>
                </View>
                <Text style={[styles.featProviderName, { color: colors.textSecondary }]}>{item.ownerName}</Text>
              </View>
              <View style={[styles.featBottom, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.featPrice, { color: colors.accent }]}>{price}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Star color={colors.yellow} fill={colors.yellow} size={12} />
                  <Text style={[styles.featRating, { color: colors.text }]}>4.8</Text>
                </View>
              </View>
            </PressableScale>
          );
        }}
      />
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
  const { colors } = useTheme();
  const [saved, setSaved] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [fadeIn]);

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
    <Animated.View style={{ opacity: fadeIn }}>
      <PressableScale
        onPress={() => router.push(`/service/${item.id}`)}
        style={[styles.serviceCard, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}
        haptic
        testID={`service-${item.id}`}
      >
        <View style={[styles.cardTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1, gap: 6, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.serviceTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]} numberOfLines={2}>{title}</Text>
            <View style={[styles.providerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.providerAvatar, { backgroundColor: avatarColor }]}>
                <Text style={styles.providerInitial}>{item.ownerInitial}</Text>
              </View>
              <Text style={[styles.providerName, { color: colors.textSecondary }]}>{item.ownerName}</Text>
              <View style={[styles.catBadge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.catBadgeText, { color: colors.accent }]}>{category}</Text>
              </View>
            </View>
          </View>
          <Pressable onPress={handleSave} hitSlop={8}>
            <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
              <Bookmark
                color={saved ? colors.accent : colors.textMuted}
                fill={saved ? colors.accent : 'transparent'}
                size={18}
                strokeWidth={1.5}
              />
            </Animated.View>
          </Pressable>
        </View>

        <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ gap: 4 }}>
            <Text style={[styles.priceText, { color: colors.accent }]}>{price}</Text>
            <View style={[styles.deliveryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Clock color={colors.textMuted} size={12} strokeWidth={1.5} />
              <Text style={[styles.deliveryText, { color: colors.textMuted }]}>{delivery}</Text>
            </View>
          </View>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.ratingWrap, { backgroundColor: colors.yellowLight }]}>
              <Star color={colors.yellow} fill={colors.yellow} size={10} />
              <Text style={[styles.ratingText, { color: colors.text }]}>4.8</Text>
            </View>
            {isRequested ? (
              <View style={[styles.requestedBtn, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.requestedText, { color: colors.accent }]}>
                  {language === 'ar' ? 'تم الطلب' : 'Requested'}
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={handleRequest}
                style={({ pressed }) => [styles.requestBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.requestText}>
                  {language === 'ar' ? 'طلب' : 'Request'}
                </Text>
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
                <FeaturedSection services={services as ServiceItem[]} />
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
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 12 },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 12 },
  searchText: { flex: 1, fontSize: 15 },
  catRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  catPill: { paddingHorizontal: 14, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  catText: { fontSize: 13, fontWeight: '500' as const },
  featuredSection: { paddingBottom: 12, gap: 10 },
  featuredSectionTitle: { fontSize: 17, fontWeight: '600' as const },
  featuredCard: { width: 240, padding: 14, borderRadius: 12, gap: 8 },
  featCatBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  featCatText: { fontSize: 11, fontWeight: '600' as const },
  featTitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 21 },
  featProvider: { alignItems: 'center', gap: 6 },
  featAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featAvatarText: { color: '#FFF', fontSize: 10, fontWeight: '700' as const },
  featProviderName: { fontSize: 13 },
  featBottom: { alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  featPrice: { fontSize: 15, fontWeight: '600' as const },
  featRating: { fontSize: 13, fontWeight: '600' as const },
  serviceCard: { marginHorizontal: 16, marginTop: 8, padding: 14, borderRadius: 12, gap: 12 },
  cardTop: { gap: 10 },
  serviceTitle: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  providerRow: { alignItems: 'center', gap: 6 },
  providerAvatar: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  providerInitial: { color: '#FFF', fontSize: 9, fontWeight: '700' as const },
  providerName: { fontSize: 13 },
  catBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 11, fontWeight: '600' as const },
  cardFooter: { alignItems: 'center', justifyContent: 'space-between' },
  priceText: { fontSize: 15, fontWeight: '600' as const },
  deliveryRow: { alignItems: 'center', gap: 4 },
  deliveryText: { fontSize: 12 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 12, fontWeight: '600' as const },
  requestBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  requestText: { color: '#FFF', fontSize: 13, fontWeight: '600' as const },
  requestedBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  requestedText: { fontSize: 13, fontWeight: '600' as const },
  emptyWrap: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '600' as const },
  emptyDesc: { fontSize: 13, textAlign: 'center' as const },
});
