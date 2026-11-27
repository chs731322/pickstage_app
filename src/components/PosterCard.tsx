import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalSummary } from '@/features/festivals';
import { festivalStatus, formatDateRange } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

// 카드에 필요한 값만 (공연 목록, 아티스트·공연장의 공연 목록에서 같이 쓴다)
export type PosterCardFestival = Pick<FestivalSummary, 'id' | 'title' | 'posterImage' | 'startDate' | 'endDate'>;

// 포스터와 이름, 날짜가 있는 공연 카드 (가로로 넘겨 보는 목록용)
export function PosterCard({ festival, width = 150 }: { festival: PosterCardFestival; width?: number }) {
  const status = festivalStatus(festival.startDate, festival.endDate);
  const ended = status?.kind === 'ended';
  return (
    <Pressable
      onPress={() => router.push(`/festival/${festival.id}`)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${festival.title} 상세 보기`}>
      <View style={styles.posterWrap}>
        {festival.posterImage ? (
          <Image
            source={{ uri: festival.posterImage }}
            style={[styles.poster, ended && styles.posterEnded]}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.poster, styles.noPoster]}>
            <AppText color={colors.textMuted} size={12}>
              포스터 준비 중
            </AppText>
          </View>
        )}
        {status ? (
          <View style={[styles.badge, status.kind === 'ended' && styles.badgeEnded, status.kind === 'live' && styles.badgeLive]}>
            <AppText weight="bold" size={12} color={colors.white}>
              {status.label}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText weight="medium" size={13} color={ended ? colors.textMuted : colors.brand} style={styles.date}>
        {formatDateRange(festival.startDate, festival.endDate)}
      </AppText>
      <AppText weight="bold" size={16} numberOfLines={2} style={styles.title}>
        {festival.title}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  posterWrap: {
    aspectRatio: 3 / 4,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  poster: { width: '100%', height: '100%' },
  // 끝난 공연은 포스터를 흐리게
  posterEnded: { opacity: 0.45 },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  badgeLive: { backgroundColor: colors.text },
  badgeEnded: { backgroundColor: colors.textMuted },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  date: { marginBottom: spacing.xs },
  title: { lineHeight: 22 },
});
