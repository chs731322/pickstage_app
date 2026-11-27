import { useHeaderHeight } from 'expo-router/react-navigation';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Avatar } from '@/components/Avatar';
import { useBlockedUsers, useUnblock, type BlockedUser } from '@/features/me';
import { errorMessage } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

// 내가 차단한 사용자: 보고 해제한다
export default function BlockedUsersScreen() {
  const headerHeight = useHeaderHeight();
  const { data, isPending, error } = useBlockedUsers();
  const unblock = useUnblock();

  const confirmUnblock = (user: BlockedUser) =>
    Alert.alert(`${user.nickname}님의 차단을 해제할까요?`, '이 사용자의 글·댓글·후기가 다시 보여요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '차단 해제',
        onPress: () =>
          unblock.mutate(user.userId, {
            onError: (e) => Alert.alert('차단을 해제하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
          }),
      },
    ]);

  return (
    <FlatList
      style={styles.list}
      data={data ?? []}
      keyExtractor={(item) => String(item.userId)}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      ListHeaderComponent={
        <AppText size={14} color={colors.textSecondary} style={styles.desc}>
          차단한 사용자의 글·댓글·후기는 나에게 보이지 않아요. 상대에게는 차단 사실이 알려지지 않아요.
        </AppText>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Avatar uri={item.profileImage} name={item.nickname} size={48} />
          <View style={styles.info}>
            <AppText weight="bold" size={16}>
              {item.nickname}
            </AppText>
            {item.blockedAt ? (
              <AppText size={13} color={colors.textMuted}>
                {item.blockedAt.slice(0, 10).replaceAll('-', '.')} 차단
              </AppText>
            ) : null}
          </View>
          <Pressable onPress={() => confirmUnblock(item)} style={styles.button} accessibilityRole="button">
            <AppText weight="semibold" size={14}>
              차단 해제
            </AppText>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator color={colors.brand} style={styles.state} />
        ) : (
          <EmptyState
            variant={error ? 'error' : 'empty'}
            title={error ? '차단 목록을 불러오지 못했어요' : '차단한 사용자가 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : undefined}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  desc: { lineHeight: 21, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  info: { flex: 1, gap: 2 },
  button: { paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center' },
});
