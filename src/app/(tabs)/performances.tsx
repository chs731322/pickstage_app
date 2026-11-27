import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import { PosterCard } from '@/components/PosterCard';
import { TabHero } from '@/components/TabHero';
import {
  LIST_GENRES,
  LIST_REGIONS,
  LIST_SORTS,
  useFestivalList,
  type ListFilters,
} from '@/features/festivals';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { colors, fontFamily, radius, spacing } from '@/theme';

const COLUMNS = 2;
const GAP = 14;

const DEFAULT_FILTERS: ListFilters = { sort: 'popular', region: '전체', genre: '', keyword: '' };

export default function PerformancesScreen() {
  const { width } = useWindowDimensions();
  const [filters, setFilters] = useState<ListFilters>(DEFAULT_FILTERS);
  // 검색어는 입력하는 동안은 입력칸에만 두고, 검색(키보드의 확인)을 눌렀을 때 목록에 적용한다
  const [searchText, setSearchText] = useState('');
  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, refetch, isRefetching, error } =
    useFestivalList(filters);

  const items = data?.pages.flatMap((page) => page.content) ?? [];
  const total = data?.pages[0]?.totalElements ?? 0;
  const cardWidth = (width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const hasFilters = filters.region !== '전체' || filters.genre !== '' || filters.keyword !== '';

  const update = (patch: Partial<ListFilters>) => setFilters((prev) => ({ ...prev, ...patch }));
  const applySearch = (text: string) => {
    setSearchText(text);
    update({ keyword: text });
  };
  const reset = () => {
    setSearchText('');
    setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  };

  const header = (
    <View style={styles.header}>
      <TabHero
        title="공연 탐색"
        subtitle="곧 열리는 공연을 찾아봐요">
        <View style={styles.links}>
          <Pressable onPress={() => router.push('/artists')} hitSlop={8} style={styles.venueLink} accessibilityRole="button">
            <AppText weight="bold" size={14} color={colors.brand}>
              아티스트
            </AppText>
          </Pressable>
          <Pressable onPress={() => router.push('/venues')} hitSlop={8} style={styles.venueLink} accessibilityRole="button">
            <AppText weight="bold" size={14} color={colors.brand}>
              공연장
            </AppText>
          </Pressable>
        </View>

      {/* 공연명·아티스트 검색 */}
      <View style={styles.search}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          tintColor={colors.textMuted}
          size={20}
        />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => update({ keyword: searchText })}
          placeholder="공연이나 아티스트를 검색해보세요"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {searchText ? (
          <Pressable onPress={() => applySearch('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }}
              tintColor={colors.clearButton}
              size={20}
            />
          </Pressable>
        ) : null}
      </View>
      </TabHero>

      {/* 지역 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}
        contentContainerStyle={styles.pills}>
        {LIST_REGIONS.map((region) => (
          <FilterPill key={region} label={region} active={filters.region === region} onPress={() => update({ region })} />
        ))}
      </ScrollView>

      {/* 장르 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}
        contentContainerStyle={styles.pills}>
        <FilterPill label="전체 장르" active={filters.genre === ''} onPress={() => update({ genre: '' })} />
        {LIST_GENRES.map((genre) => (
          <FilterPill
            key={genre}
            label={festivalGenreLabel(genre) ?? genre}
            active={filters.genre === genre}
            onPress={() => update({ genre })}
          />
        ))}
      </ScrollView>

      {/* 정렬 (왼쪽), 결과 수 (오른쪽) */}
      <View style={styles.sortRow}>
        <View style={styles.sorts}>
          {LIST_SORTS.map((sort) => (
            <Pressable key={sort.id} onPress={() => update({ sort: sort.id })} hitSlop={6}>
              <AppText
                weight={filters.sort === sort.id ? 'bold' : 'medium'}
                size={14}
                color={filters.sort === sort.id ? colors.text : colors.textMuted}>
                {sort.label}
              </AppText>
            </Pressable>
          ))}
        </View>
        <View style={styles.counts}>
          {hasFilters ? (
            <Pressable onPress={reset} hitSlop={8}>
              <AppText weight="semibold" size={14} color={colors.brand}>
                초기화
              </AppText>
            </Pressable>
          ) : null}
          {!isPending && !error ? (
            <AppText size={14} color={colors.textMuted}>
              {total}개
            </AppText>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(item) => String(item.id)}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PosterCard festival={item} width={cardWidth} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={refetch}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator color={colors.brand} style={styles.state} />
          ) : (
            <EmptyState
              variant={error ? 'error' : 'empty'}
              title={error ? '공연 정보를 불러오지 못했어요' : '조건에 맞는 공연이 없어요'}
              description={error ? '아래로 당겨서 다시 시도해보세요.' : '지역이나 장르를 바꿔보세요.'}
              actionLabel={error ? '다시 시도' : hasFilters ? '조건 초기화' : undefined}
              onAction={error ? () => refetch() : hasFilters ? reset : undefined}
            />
          )
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  list: { backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  column: { gap: GAP, marginBottom: spacing.lg },
  links: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  venueLink: { paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.white },
  header: { gap: spacing.ms, paddingBottom: spacing.md },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  // 알약 줄은 화면 양끝까지 스크롤되도록 안쪽 여백만큼 바깥으로 넓힌다
  pillsScroll: { marginHorizontal: -spacing.md, flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.md },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sorts: { flexDirection: 'row', gap: spacing.md },
  counts: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center' },
  footer: { marginVertical: spacing.lg },
});
