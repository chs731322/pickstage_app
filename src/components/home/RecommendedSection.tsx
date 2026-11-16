import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PosterCard } from '@/components/PosterCard';
import { SectionHeader } from '@/components/SectionHeader';
import { useRecommendedFestivals } from '@/features/festivals';
import { colors, spacing } from '@/theme';

const SHOWN_ARTISTS = 2;

// "OOO, OOO 외 1팀 출연"
function matchedLabel(artists: string[] | null): string {
  if (!artists || artists.length === 0) return '';
  const shown = artists.slice(0, SHOWN_ARTISTS).join(', ');
  const rest = artists.length - SHOWN_ARTISTS;
  return rest > 0 ? `${shown} 외 ${rest}팀 출연` : `${shown} 출연`;
}

// 홈의 "내 취향 공연": 내가 관심 등록한 아티스트가 라인업에 있는 예정 공연 (로그인하고 추천할 공연이 있을 때만 보인다)
export function RecommendedSection() {
  const { data } = useRecommendedFestivals(4);
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title="내 취향 공연" onPressMore={() => router.push('/my/artists')} />
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <PosterCard festival={item} />
            {matchedLabel(item.matchedArtists) ? (
              <AppText size={13} weight="semibold" color={colors.brand} numberOfLines={2} style={styles.matched}>
                {matchedLabel(item.matchedArtists)}
              </AppText>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  list: { gap: spacing.md, paddingHorizontal: spacing.md },
  item: { width: 150 },
  matched: { marginTop: 2, lineHeight: 18 },
});
