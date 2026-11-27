import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Avatar } from '@/components/Avatar';
import { useInterestedArtists } from '@/features/artists';
import { colors, spacing } from '@/theme';

const COLUMNS = 3;
const GAP = 12;

// 내가 관심 등록한 아티스트
export default function MyArtistsScreen() {
  const { width } = useWindowDimensions();
  const headerHeight = useHeaderHeight();
  const { data, isPending, error, refetch, isRefetching } = useInterestedArtists();
  const itemWidth = (width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <FlatList
      style={styles.list}
      data={data ?? []}
      keyExtractor={(item) => String(item.id)}
      numColumns={COLUMNS}
      columnWrapperStyle={styles.column}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      refreshing={isRefetching}
      onRefresh={refetch}
      ListHeaderComponent={
        data && data.length > 0 ? (
          <AppText size={14} color={colors.textMuted} style={styles.count}>
            총 {data.length}팀
          </AppText>
        ) : undefined
      }
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/artist/${item.id}`)} style={{ width: itemWidth }} accessibilityRole="button">
          <Avatar uri={item.profileImage} name={item.name} size={itemWidth} />
          <AppText weight="semibold" size={14} numberOfLines={2} style={styles.name}>
            {item.name}
          </AppText>
        </Pressable>
      )}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator color={colors.brand} style={styles.state} />
        ) : (
          <EmptyState
            variant={error ? 'error' : 'empty'}
            title={error ? '관심 아티스트를 불러오지 못했어요' : '아직 관심 아티스트가 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : '좋아하는 아티스트를 추가하면 맞춤 공연을 추천해드려요.'}
            actionLabel={error ? undefined : '아티스트 찾기'}
            onAction={error ? undefined : () => router.push('/artists')}
          />
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
  name: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
});
