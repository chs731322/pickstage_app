import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalSummary } from '@/features/festivals';
import { formatDateRange } from '@/lib/format';
import { colors, spacing } from '@/theme';

// 포스터와 이름, 날짜가 있는 공연 카드 (가로로 넘겨 보는 목록용)
export function PosterCard({ festival, width = 150 }: { festival: FestivalSummary; width?: number }) {
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
      <AppText weight="semibold" size={14} numberOfLines={2} style={styles.title}>
        {festival.title}
      </AppText>
      <AppText color={colors.textMuted} size={12}>
        {formatDateRange(festival.startDate, festival.endDate)}
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
  title: { minHeight: 36, lineHeight: 18, marginBottom: 2 },
});
