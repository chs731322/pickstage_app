import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalSummary } from '@/features/festivals';
import { formatOpenAt, ticketDDay } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

// "티켓 오픈 일정" 카드: 큼직한 D-day(OPEN)와 공연 이름, 오픈 시각
export function TicketCard({ festival }: { festival: FestivalSummary }) {
  const dday = ticketDDay(festival.ticketOpenAt);

  return (
    <Pressable
      onPress={() => router.push(`/festival/${festival.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${festival.title} 상세 보기`}>
      <View style={styles.top}>
        <AppText weight="bold" size={22} color={colors.brand}>
          {dday}
        </AppText>
        <View style={styles.tag}>
          <AppText weight="bold" size={12} color={colors.white}>
            {festival.ticketLabel ?? '일반'}
          </AppText>
        </View>
      </View>
      <AppText weight="semibold" size={14} numberOfLines={2} style={styles.title}>
        {festival.title}
      </AppText>
      <AppText weight="bold" size={14}>
        {formatOpenAt(festival.ticketOpenAt)}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.text },
  title: { minHeight: 40, lineHeight: 20 },
});
