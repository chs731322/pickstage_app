import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalSummary } from '@/features/festivals';
import { formatOpenAt, ticketDDay } from '@/lib/format';
import { colors, spacing } from '@/theme';

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
        <AppText weight="extrabold" size={30} color={colors.brand}>
          {dday}
        </AppText>
        <View style={styles.tag}>
          <AppText weight="bold" size={11} color={colors.white}>
            {festival.ticketLabel ?? '일반'}
          </AppText>
        </View>
      </View>
      <AppText weight="semibold" size={15} numberOfLines={2} style={styles.title}>
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
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  pressed: { opacity: 0.85 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.text },
  title: { minHeight: 40, lineHeight: 20 },
});
