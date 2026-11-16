import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalSummary } from '@/features/festivals';
import { formatDateRange } from '@/lib/format';
import { colors, spacing } from '@/theme';

// 카드에 필요한 값만 (공연 목록, 아티스트·공연장의 공연 목록에서 같이 쓴다)
export type PosterCardFestival = Pick<FestivalSummary, 'id' | 'title' | 'posterImage' | 'startDate' | 'endDate'>;

// 포스터와 이름, 날짜가 있는 공연 카드 (가로로 넘겨 보는 목록용)
export function PosterCard({ festival, width = 150 }: { festival: PosterCardFestival; width?: number }) {
  return (
    <Pressable
      onPress={() => router.push(`/festival/${festival.id}`)}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${festival.title} 상세 보기`}>
      <View style={styles.posterWrap}>
        {festival.posterImage ? (
          <Image source={{ uri: festival.posterImage }} style={styles.poster} contentFit="cover" transition={150} />
        ) : (
          <View style={[styles.poster, styles.noPoster]}>
            <AppText color={colors.textMuted} size={12}>
              포스터 준비 중
            </AppText>
          </View>
        )}
      </View>
      <AppText weight="medium" size={13} color={colors.brand} style={styles.date}>
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
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  poster: { width: '100%', height: '100%' },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  date: { marginBottom: 4 },
  title: { lineHeight: 22 },
});
