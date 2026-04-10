import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  Archive,
  Inbox,
  SquarePen,
  Search,
} from 'lucide-react-native';

import { EmptyState } from '@/components/EmptyState';
import { PressableScale } from '@/components/PressableScale';
import { ConversationSkeleton } from '@/components/SkeletonLoader';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { trpcClient } from '@/lib/trpc';

const FILTER_TABS_AR = ['الكل', 'غير مقروء'];
const FILTER_TABS_EN = ['All', 'Unread'];

const AVATAR_COLORS = [
  '#0F8B8D', '#1D4ED8', '#EF4444', '#6366F1', '#0891B2',
  '#EC4899', '#14B8A6', '#2563EB', '#7C3AED', '#F59E0B',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitial(name: string): string {
  return (name.charAt(0) || '?').toUpperCase();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

interface ConversationItem {
  id: string;
  participants: string[];
  otherUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  lastMessage: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
    readBy: string[];
  } | null;
  unreadCount: number;
  updatedAt: string;
  communityId?: string;
  communityName?: string;
  communityIcon?: string;
}

const POLL_INTERVAL = 8000;

function Header() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={styles.headerWrap}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.headerTitle, { textAlign: isRTL ? 'right' : 'left', color: colors.text }]}>
          {language === 'ar' ? 'الرسائل' : 'Messages'}
        </Text>
        <Pressable
          onPress={() => router.push('/new-conversation')}
          style={({ pressed }) => [styles.newMsgBtn, { backgroundColor: colors.accent }, pressed && { opacity: 0.85 }]}
          testID="new-message-btn"
        >
          <SquarePen color="#FFF" size={17} strokeWidth={2} />
        </Pressable>
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
        <Text style={[styles.searchText, { textAlign: isRTL ? 'right' : 'left', color: colors.textMuted }]}>
          {language === 'ar' ? 'ابحث في المحادثات...' : 'Search conversations...'}
        </Text>
      </View>
    </View>
  );
}

function FilterTabs({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const tabs = language === 'ar' ? FILTER_TABS_AR : FILTER_TABS_EN;

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
          style={[
            styles.filterPill,
            active === index
              ? { backgroundColor: colors.accent }
              : { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
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

const ConversationRow = React.memo(function ConversationRow({
  item,
  currentUserId,
}: {
  item: ConversationItem;
  currentUserId: string;
}) {
  const router = useRouter();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const hasUnread = item.unreadCount > 0;
  const isCommunity = !!item.communityId;
  const name = isCommunity ? (item.communityName ?? 'Community') : item.otherUser.name;
  const initial = isCommunity ? '' : getInitial(name);
  const avatarColor = isCommunity ? '#818CF8' : getAvatarColor(item.otherUser.id);
  const time = item.lastMessage ? formatTime(item.lastMessage.createdAt) : formatTime(item.updatedAt);
  const preview = item.lastMessage
    ? (item.lastMessage.senderId === currentUserId ? 'You: ' : '') + item.lastMessage.content
    : (isCommunity ? 'Community chat' : '');

  return (
    <PressableScale
      onPress={() => router.push(`/chat/${item.id}`)}
      style={[
        styles.chatRow,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
        hasUnread && { backgroundColor: colors.accentSoft2 },
      ]}
      haptic
      testID={`conversation-${item.id}`}
    >
      <View style={styles.avatarWrap}>
        {isCommunity ? (
          <View style={[styles.avatar, { backgroundColor: 'rgba(129,140,248,0.12)' }]}>
            <Text style={{ fontSize: 22 }}>{item.communityIcon ?? '👥'}</Text>
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
        {!isCommunity ? (
          <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.bg }]} />
        ) : null}
      </View>

      <View style={[styles.chatInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.chatNameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Text style={[styles.chatName, { color: colors.text }, hasUnread && styles.chatNameUnread]} numberOfLines={1}>{name}</Text>
          </View>
          <Text style={[styles.chatTime, { color: colors.textMuted }, hasUnread && { color: colors.accent, fontWeight: '600' as const }]}>{time}</Text>
        </View>
        <View style={[styles.previewRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[styles.chatPreview, { textAlign: isRTL ? 'right' : 'left', color: colors.textSecondary }, hasUnread && { color: colors.text, fontWeight: '500' as const }]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View style={[styles.unreadBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
});

function LoadingSkeleton() {
  return (
    <View>
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
      <ConversationSkeleton />
    </View>
  );
}

export default function MessagesScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setConversations([]);
      setIsLoading(false);
      return;
    }
    try {
      console.log('[Messages] fetching conversations...');
      const data = await trpcClient.messages.listConversations.query();
      console.log('[Messages] fetched', data.length, 'conversations');
      setConversations(data);
    } catch (err) {
      console.log('[Messages] fetch error', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      console.log('[Messages] polling conversations...');
      void fetchConversations();
    }, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchConversations]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [fetchConversations]);

  const filteredConversations = useMemo(() => {
    if (activeFilter === 0) return conversations;
    if (activeFilter === 1) return conversations.filter((c) => c.unreadCount > 0);
    return conversations;
  }, [activeFilter, conversations]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.bg }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <Header />
          <EmptyState
            icon={Inbox}
            title={language === 'ar' ? 'سجّل الدخول للمراسلة' : 'Sign in to message'}
            description={language === 'ar' ? 'سجّل الدخول لبدء المحادثات' : 'Sign in to start conversations'}
            iconColor={colors.accent}
          />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Header />
        <FilterTabs active={activeFilter} onSelect={setActiveFilter} />
        {isLoading ? (
          <LoadingSkeleton />
        ) : filteredConversations.length === 0 ? (
          <EmptyState
            icon={activeFilter === 1 ? Archive : Inbox}
            title={
              activeFilter === 1
                ? (language === 'ar' ? 'لا توجد رسائل غير مقروءة' : 'No unread messages')
                : (language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet')
            }
            description={
              activeFilter === 1
                ? (language === 'ar' ? 'أنت على اطلاع بكل الرسائل' : 'You\'re all caught up')
                : (language === 'ar' ? 'ابدأ محادثة مع خبير أو زميل مهني' : 'Start a conversation with an expert or colleague')
            }
            actionLabel={activeFilter === 0 ? (language === 'ar' ? 'رسالة جديدة' : 'New message') : undefined}
            onAction={activeFilter === 0 ? () => router.push('/new-conversation') : undefined}
            iconColor={colors.accent}
          />
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationRow item={item} currentUserId={user?.id ?? ''} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
            testID="messages-list"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  listContent: { paddingBottom: 120, flexGrow: 1 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 12 },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
  newMsgBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  searchBar: { alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 44, borderRadius: 14 },
  searchText: { flex: 1, fontSize: 15 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  filterPill: { paddingHorizontal: 16, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '500' as const },
  chatRow: { alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12 },
  avatarWrap: { position: 'relative' as const },
  avatar: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' as const },
  onlineDot: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  chatInfo: { flex: 1, gap: 4 },
  chatNameRow: { alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chatName: { fontSize: 15, fontWeight: '500' as const },
  chatNameUnread: { fontWeight: '700' as const },
  chatTime: { fontSize: 12 },
  previewRow: { alignItems: 'center', gap: 8 },
  chatPreview: { flex: 1, fontSize: 13, lineHeight: 18 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#FFF', fontSize: 11, fontWeight: '700' as const },
  separator: { height: 1, marginLeft: 78 },
});
