import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { isPinnedNotice, useNotice } from '@/features/notices';
import { cardShadow, colors, radius, spacing } from '@/theme';

// 공지사항 상세: 제목, 날짜, 본문
export default function NoticeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: notice, isPending, error } = useNotice(id);

  return (
    <Screen topInset={false} tone="page">
      {isPending ? (
        <ActivityIndicator color={colors.brand} style={styles.state} />
      ) : error || !notice ? (
        <AppText color={colors.textMuted} size={16} style={[styles.state, styles.center]}>
          공지사항을 찾을 수 없어요.
        </AppText>
      ) : (
        <View style={styles.card}>
          {isPinnedNotice(notice) ? (
            <View style={styles.pin}>
              <AppText weight="bold" size={12} color={colors.brand}>
                고정
              </AppText>
            </View>
          ) : null}
          <AppText weight="bold" size={18} style={styles.title}>
            {notice.title}
          </AppText>
          <AppText size={14} color={colors.textMuted}>
            {notice.createdAt?.slice(0, 10)}
          </AppText>
          <View style={styles.divider} />
          <AppText size={16} style={styles.content} selectable>
            {notice.content}
          </AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  pin: { alignSelf: 'flex-start', paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  title: { lineHeight: 30 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  content: { lineHeight: 24 },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center' },
});
