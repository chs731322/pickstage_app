import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { CalendarFestival } from '@/lib/calendar';
import { festivalStatus, formatDateRange } from '@/lib/format';
import { colors, spacing } from '@/theme';

// 캘린더·홈 주간 캘린더에서 고른 날의 공연 한 줄: 포스터, 상태, 이름, 기간, 공연장 (왼쪽 띠는 달력의 막대 색과 같다)
export function CalendarEventRow({ festival, color }: { festival: CalendarFestival; color?: string }) {
  const status = festivalStatus(festival.startDate, festival.endDate);
  return (
    <Pressable
      onPress={() => router.push(`/festival/${festival.id}`)}
      style={({ pressed }) => [styles.event, pressed && styles.pressed]}
      accessibilityRole="button">
      <View style={[styles.stripe, color ? { backgroundColor: color } : null]} />
      {festival.posterImage ? (
        <Image source={{ uri: festival.posterImage }} style={styles.poster} contentFit="cover" transition={150} />
      ) : (
        <View style={styles.poster} />
      )}
      <View style={styles.info}>
        <View style={styles.top}>
          {status ? (
            <AppText weight="bold" size={12} color={status.kind === 'ended' ? colors.textMuted : colors.brand}>
              {status.label}
            </AppText>
          ) : null}
          {festival.region ? (
            <AppText size={12} color={colors.textMuted}>
              {festival.region}
            </AppText>
          ) : null}
        </View>
        <AppText weight="bold" size={16} numberOfLines={2} style={styles.title}>
          {festival.title}
        </AppText>
        <AppText size={13} color={colors.textSecondary}>
          {formatDateRange(festival.startDate, festival.endDate)}
        </AppText>
        {festival.venueName ? (
          <AppText size={13} color={colors.textMuted} numberOfLines={1}>
            {festival.venueName}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  event: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: 18, backgroundColor: colors.white, overflow: 'hidden' },
  pressed: { opacity: 0.85 },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: colors.border },
  poster: { width: 66, height: 88, borderRadius: 10, backgroundColor: colors.surface },
  info: { flex: 1, gap: 3 },
  top: { flexDirection: 'row', gap: spacing.sm },
  title: { lineHeight: 22 },
});
