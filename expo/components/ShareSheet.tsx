import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  ExternalLink,
  MessageSquare,
  Quote,
  Repeat2,
  Send,
  Users,
  X,
} from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import type { EnrichedPost, ShareAction } from '@/types/post';

interface ShareSheetProps {
  visible: boolean;
  post: EnrichedPost | null;
  onClose: () => void;
  onAction: (action: ShareAction, data?: { comment?: string; recipientId?: string; groupId?: string }) => void;
}

interface ShareOption {
  id: ShareAction;
  icon: React.ComponentType<any>;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  color: string;
  bgColor: string;
}

export function ShareSheet({ visible, post, onClose, onAction }: ShareSheetProps) {
  const { colors, isDark } = useTheme();
  const { isRTL, language } = useLanguage();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [quoteMode, setQuoteMode] = useState(false);
  const [quoteText, setQuoteText] = useState('');

  useEffect(() => {
    if (visible) {
      setQuoteMode(false);
      setQuoteText('');
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 22,
          stiffness: 200,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, backdropOpacity]);

  const options: ShareOption[] = [
    {
      id: 'repost',
      icon: Repeat2,
      labelAr: 'إعادة نشر',
      labelEn: 'Repost',
      descAr: 'شاركه مع متابعيك',
      descEn: 'Share with your followers',
      color: colors.accent,
      bgColor: colors.accentLight,
    },
    {
      id: 'quote',
      icon: Quote,
      labelAr: 'اقتبس المنشور',
      labelEn: 'Quote Post',
      descAr: 'أضف تعليقك وأعد النشر',
      descEn: 'Add your comment and repost',
      color: colors.secondary,
      bgColor: colors.secondaryLight,
    },
    {
      id: 'send_private',
      icon: Send,
      labelAr: 'أرسل في رسالة خاصة',
      labelEn: 'Send Privately',
      descAr: 'أرسل إلى شخص محدد',
      descEn: 'Send to a specific person',
      color: colors.info,
      bgColor: colors.infoLight,
    },
    {
      id: 'send_group',
      icon: Users,
      labelAr: 'أرسل إلى مجموعة',
      labelEn: 'Send to Group',
      descAr: 'شارك في محادثة جماعية',
      descEn: 'Share in a group chat',
      color: colors.gold,
      bgColor: colors.goldLight,
    },
    {
      id: 'copy_link',
      icon: Copy,
      labelAr: 'نسخ الرابط',
      labelEn: 'Copy Link',
      descAr: 'انسخ رابط المنشور',
      descEn: 'Copy post link',
      color: colors.textSecondary,
      bgColor: isDark ? colors.bgMuted : colors.bgSecondary,
    },
    {
      id: 'external',
      icon: ExternalLink,
      labelAr: 'مشاركة خارجية',
      labelEn: 'Share Externally',
      descAr: 'شارك عبر تطبيقات أخرى',
      descEn: 'Share via other apps',
      color: colors.textSecondary,
      bgColor: isDark ? colors.bgMuted : colors.bgSecondary,
    },
  ];

  const handleOptionPress = useCallback(async (option: ShareOption) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (option.id === 'quote') {
      setQuoteMode(true);
      return;
    }

    if (option.id === 'copy_link' && post) {
      const link = `https://muwassa.app/post/${post.id}`;
      try {
        await Clipboard.setStringAsync(link);
        console.log('[ShareSheet] copied link:', link);
      } catch (err) {
        console.log('[ShareSheet] clipboard error:', err);
      }
      onAction('copy_link');
      onClose();
      return;
    }

    if (option.id === 'external' && post) {
      try {
        await Share.share({
          message: `${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}\n\nhttps://muwassa.app/post/${post.id}`,
        });
      } catch (err) {
        console.log('[ShareSheet] external share error:', err);
      }
      onClose();
      return;
    }

    onAction(option.id);
    onClose();
  }, [post, onAction, onClose]);

  const handleQuoteSubmit = useCallback(() => {
    if (!quoteText.trim()) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction('quote', { comment: quoteText.trim() });
    setQuoteMode(false);
    setQuoteText('');
    onClose();
  }, [quoteText, onAction, onClose]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  if (!visible && !post) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={ss.modalWrap}>
        <Animated.View
          style={[ss.backdrop, { opacity: backdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            ss.sheet,
            {
              transform: [{ translateY }],
              backgroundColor: isDark ? colors.bgCard : colors.white,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={ss.handle}>
            <View style={[ss.handleBar, { backgroundColor: colors.textMuted }]} />
          </View>

          <View style={[ss.sheetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {quoteMode ? (
              <Pressable
                onPress={() => setQuoteMode(false)}
                style={[ss.headerBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]}
              >
                {isRTL ? (
                  <ArrowRight color={colors.text} size={18} strokeWidth={1.8} />
                ) : (
                  <ArrowLeft color={colors.text} size={18} strokeWidth={1.8} />
                )}
              </Pressable>
            ) : null}
            <Text style={[ss.sheetTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {quoteMode
                ? (language === 'ar' ? 'اقتبس المنشور' : 'Quote Post')
                : (language === 'ar' ? 'مشاركة' : 'Share')
              }
            </Text>
            <Pressable
              onPress={onClose}
              style={[ss.headerBtn, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary }]}
            >
              <X color={colors.text} size={18} strokeWidth={1.8} />
            </Pressable>
          </View>

          {quoteMode ? (
            <View style={ss.quoteSection}>
              {post && (
                <View style={[ss.quotedPreview, { backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary, borderColor: colors.border }]}>
                  <View style={[ss.quotedBar, { backgroundColor: colors.accent }]} />
                  <View style={ss.quotedContent}>
                    <Text style={[ss.quotedAuthor, { color: colors.text }]}>{post.authorName}</Text>
                    <Text style={[ss.quotedText, { color: colors.textSecondary }]} numberOfLines={3}>
                      {post.content}
                    </Text>
                  </View>
                </View>
              )}

              <TextInput
                value={quoteText}
                onChangeText={setQuoteText}
                placeholder={language === 'ar' ? 'أضف تعليقك...' : 'Add your comment...'}
                placeholderTextColor={colors.textMuted}
                style={[
                  ss.quoteInput,
                  {
                    color: colors.text,
                    backgroundColor: isDark ? colors.bgMuted : colors.bgSecondary,
                    borderColor: colors.border,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                ]}
                multiline
                autoFocus
              />

              <Pressable
                onPress={handleQuoteSubmit}
                disabled={!quoteText.trim()}
                style={[
                  ss.quoteSubmitBtn,
                  { backgroundColor: quoteText.trim() ? colors.accent : (isDark ? colors.bgMuted : colors.bgSecondary) },
                ]}
              >
                <Text style={[ss.quoteSubmitText, { color: quoteText.trim() ? '#FFF' : colors.textMuted }]}>
                  {language === 'ar' ? 'نشر الاقتباس' : 'Post Quote'}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={ss.optionsList}>
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => { void handleOptionPress(option); }}
                    style={({ pressed }) => [
                      ss.optionRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <View style={[ss.optionIcon, { backgroundColor: option.bgColor }]}>
                      <Icon color={option.color} size={18} strokeWidth={1.8} />
                    </View>
                    <View style={[ss.optionTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[ss.optionLabel, { color: colors.text }]}>
                        {language === 'ar' ? option.labelAr : option.labelEn}
                      </Text>
                      <Text style={[ss.optionDesc, { color: colors.textMuted }]}>
                        {language === 'ar' ? option.descAr : option.descEn}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const ss = StyleSheet.create({
  modalWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  handle: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  sheetHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700' as const,
    paddingHorizontal: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    paddingHorizontal: 16,
    gap: 4,
    paddingBottom: 8,
  },
  optionRow: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  optionDesc: {
    fontSize: 12,
  },
  quoteSection: {
    paddingHorizontal: 20,
    gap: 14,
    paddingBottom: 8,
  },
  quotedPreview: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  quotedBar: {
    width: 4,
  },
  quotedContent: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  quotedAuthor: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  quotedText: {
    fontSize: 13,
    lineHeight: 19,
  },
  quoteInput: {
    fontSize: 15,
    lineHeight: 24,
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    textAlignVertical: 'top' as const,
  },
  quoteSubmitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteSubmitText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
});
