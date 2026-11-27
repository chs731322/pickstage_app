import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import {
  NOTIFICATION_TYPE_LABEL,
  notificationTarget,
  useMarkNotificationsRead,
  useNotifications,
  type NotificationItem,
} from '@/features/notifications';
import { timeAgo } from '@/lib/postContent';
import { colors, radius, spacing } from '@/theme';

const ICONS: Record<string, { ios: string; android: string; web: string }> = {
  ticket_open: { ios: 'ticket', android: 'confirmation_number', web: 'confirmation_number' },
  concert_day: { ios: 'music.note', android: 'music_note', web: 'music_note' },
  custom: { ios: 'bell', android: 'notifications', web: 'notifications' },
  comment: { ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' },
};

// 알림: 티켓 오픈·공연 당일·내가 예약한 알림·댓글. 누르면 읽음으로 바뀌고 해당 공연·글로 이동한다.
export default function NotificationsScreen() {
  const headerHeight = useHeaderHeight();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isPending, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, isRefetching } = useNotifications(unreadOnly);
  const markRead = useMarkNotificationsRead();

  const items = data?.pages.flatMap((p) => p.content) ?? [];
  const unread = items.filter((n) => !n.isRead);

  const open = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate([n.id]);
    const target = notificationTarget(n);
    if (target) router.push(target as never);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.pills}>
        <FilterPill label="전체" active={!unreadOnly} onPress={() => setUnreadOnly(false)} />
        <FilterPill label="안 읽음" active={unreadOnly} onPress={() => setUnreadOnly(true)} />
      </View>
      <View style={styles.actions}>
        {unread.length > 0 ? (
          <Pressable onPress={() => markRead.mutate(unread.map((n) => n.id))} hitSlop={8} accessibilityRole="button">
            <AppText weight="semibold" size={14} color={colors.brand}>
              모두 읽음
            </AppText>
          </Pressable>
        ) : null}
        <Pressable onPress={() => router.push('/push-settings')} hitSlop={8} accessibilityRole="button">
          <AppText weight="semibold" size={14} color={colors.textSecondary}>
            푸시 설정 ›
          </AppText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      ListHeaderComponent={header}
      renderItem={({ item }) => <Row item={item} onPress={() => open(item)} />}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) fetchNextPage();
      }}
      onEndReachedThreshold={0.6}
      refreshing={isRefetching && !isFetchingNextPage}
      onRefresh={refetch}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator color={colors.brand} style={styles.state} />
        ) : (
          <EmptyState
            variant={error ? 'error' : 'empty'}
            title={error ? '알림을 불러오지 못했어요' : unreadOnly ? '안 읽은 알림이 없어요' : '아직 받은 알림이 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : unreadOnly ? undefined : '찜한 공연의 티켓 오픈, 내 글의 댓글 소식이 여기에 모여요.'}
          />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
    />
  );
}

function Row({ item, onPress }: { item: NotificationItem; onPress: () => void }) {
  const icon = ICONS[item.type] ?? ICONS.custom;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !item.isRead && styles.rowUnread, pressed && styles.pressed]} accessibilityRole="button">
      <View style={[styles.iconWrap, !item.isRead && styles.iconWrapUnread]}>
        <SymbolView name={icon as never} tintColor={item.isRead ? colors.textMuted : colors.brand} size={22} />
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <AppText weight="bold" size={12} color={item.isRead ? colors.textMuted : colors.brand}>
            {NOTIFICATION_TYPE_LABEL[item.type] ?? '알림'}
          </AppText>
          <AppText size={12} color={colors.textMuted}>
            {timeAgo(item.sentAt)}
          </AppText>
        </View>
        <AppText weight={item.isRead ? 'medium' : 'bold'} size={16} style={styles.title} numberOfLines={2}>
          {item.title}
        </AppText>
        {item.message ? (
          <AppText size={14} color={colors.textSecondary} numberOfLines={3} style={styles.message}>
            {item.message}
          </AppText>
        ) : null}
        {item.festivalTitle ? (
          <AppText size={13} color={colors.textMuted} numberOfLines={1}>
            {item.festivalTitle}
          </AppText>
        ) : null}
      </View>
      {!item.isRead ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { gap: spacing.sm, paddingBottom: spacing.sm },
  pills: { flexDirection: 'row', gap: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white },
  rowUnread: { backgroundColor: '#fff7fc' },
  pressed: { opacity: 0.85 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconWrapUnread: { backgroundColor: colors.brandSoft },
  body: { flex: 1, gap: spacing.xs },
  top: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  title: { lineHeight: 22 },
  message: { lineHeight: 20 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.brand, marginTop: spacing.sm },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
  footer: { marginVertical: spacing.lg },
});
