import { useHeaderHeight } from 'expo-router/react-navigation';
import { ActivityIndicator, FlatList, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PosterCard } from '@/components/PosterCard';
import { useBookmarks } from '@/features/bookmarks';
import { colors, spacing } from '@/theme';

const COLUMNS = 2;
const GAP = 14;

// 내가 찜한 공연 (최근에 찜한 순)
export default function MyBookmarksScreen() {
  const { width } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const { data, isPending, error, refetch, isRefetching } = useBookmarks();
  const cardWidth = (width - spacing.md * 2 - GAP) / COLUMNS;

  return (
    <FlatList
      style={styles.list}
      data={data ?? []}
      keyExtractor={(item) => String(item.id)}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      renderItem={({ item }) => <PosterCard festival={item} width={cardWidth} />}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        data && data.length > 0 ? (
          <AppText size={14} color={colors.textMuted} style={styles.count}>
            총 {data.length}개
          </AppText>
        ) : undefined
      }
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator color={colors.brand} style={styles.state} />
        ) : (
          <View style={styles.state}>
            <AppText color={colors.textMuted} size={16} style={styles.center}>
              {error ? '찜한 공연을 불러오지 못했어요.' : '아직 찜한 공연이 없어요.\n공연 상세에서 "찜하기"를 눌러 담아보세요.'}
            </AppText>
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  column: { gap: GAP, marginBottom: spacing.lg },
  count: { marginBottom: spacing.md },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
});
