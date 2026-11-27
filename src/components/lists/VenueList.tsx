import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, SectionList, StyleSheet, TextInput, View, type SectionListInstance } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TOP_BUTTON_OFFSET, ToTopButton } from '@/components/ToTopButton';
import { FilterPill } from '@/components/FilterPill';
import { useVenueList, venueGroupOf, VENUE_REGIONS, type VenueListItem } from '@/features/venues';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

// 공연장 목록: 지역으로 거르고 이름으로 검색해서, 가나다순으로 고른다
// title: 맨 위에 놓을 제목 영역(탭에서 쓸 때), topPadding: 위에 비워둘 높이
export function VenueList({ title, topPadding = 0 }: { title?: ReactNode; topPadding?: number }) {
  const listRef = useRef<SectionListInstance>(null);
  const [showTop, setShowTop] = useState(false);
  const [region, setRegion] = useState('전체');
  const [query, setQuery] = useState('');
  const { data, isPending, error, refetch, isRefetching } = useVenueList(region);

  const sections = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = (data ?? []).filter((v) => !keyword || v.name.toLowerCase().includes(keyword) || (v.address ?? '').toLowerCase().includes(keyword));
    const groups = new Map<string, VenueListItem[]>();
    filtered.forEach((v) => {
      const key = venueGroupOf(v.name);
      groups.set(key, [...(groups.get(key) ?? []), v]);
    });
    return { total: filtered.length, list: [...groups.entries()].map(([title, items]) => ({ title, data: items })) };
  }, [data, query]);

  const header = (
    <View style={styles.header}>
      {title}
      <View style={styles.search}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={query}
          onChangeText={setQuery}
          placeholder="공연장 이름이나 주소로 찾기"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.clearButton} size={20} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.pills}>
        {VENUE_REGIONS.map((r) => (
          <FilterPill key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
        ))}
      </View>
      {!isPending && !error ? (
        <AppText size={14} color={colors.textMuted}>
          공연장 {sections.total}곳
        </AppText>
      ) : null}
    </View>
  );

  const scrollToTop = () => listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, viewOffset: 10000, animated: true });

  return (
    <View style={styles.list}>
    <SectionList
      ref={listRef}
      scrollEventThrottle={100}
      onScroll={(event) => setShowTop(event.nativeEvent.contentOffset.y > TOP_BUTTON_OFFSET)}
      style={styles.list}
      sections={sections.list}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled
      contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <AppText weight="bold" size={14} color={colors.brand}>
            {section.title}
          </AppText>
        </View>
      )}
      renderItem={({ item }) => <VenueRow venue={item} />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshing={isRefetching}
      onRefresh={refetch}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator color={colors.brand} style={styles.state} />
        ) : (
          <EmptyState
            variant={error ? 'error' : 'empty'}
            title={error ? '공연장 목록을 불러오지 못했어요' : '조건에 맞는 공연장이 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : '검색어나 지역을 바꿔보세요.'}
          />
        )
      }
    />
      {showTop && sections.list.length > 0 ? <ToTopButton onPress={scrollToTop} /> : null}
    </View>
  );
}

function VenueRow({ venue }: { venue: VenueListItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/venue/${venue.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${venue.name} 공연장 보기`}>
      {venue.image ? (
        <Image source={{ uri: venue.image }} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumb, styles.noThumb]}>
          <SymbolView name={{ ios: 'building.2', android: 'apartment', web: 'apartment' }} tintColor={colors.textMuted} size={26} />
        </View>
      )}
      <View style={styles.info}>
        <AppText weight="bold" size={16} numberOfLines={1}>
          {venue.name}
        </AppText>
        {venue.address ? (
          <AppText size={14} color={colors.textSecondary} numberOfLines={2} style={styles.address}>
            {venue.address}
          </AppText>
        ) : null}
        {venue.region ? (
          <View style={styles.tag}>
            <AppText weight="semibold" size={12} color={colors.textSecondary}>
              {venue.region}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText size={18} color={colors.textMuted}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionHeader: { paddingVertical: spacing.sm, backgroundColor: colors.pageBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.ms, marginBottom: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.white },
  pressed: { opacity: 0.85 },
  thumb: { width: 76, height: 76, borderRadius: radius.md, backgroundColor: colors.surface },
  noThumb: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: spacing.xs },
  address: { lineHeight: 19 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface, marginTop: 2 },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
});
