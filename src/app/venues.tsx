import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { FilterPill } from '@/components/FilterPill';
import { useVenueList, venueGroupOf, VENUE_REGIONS, type VenueListItem } from '@/features/venues';
import { colors, fontFamily, radius, spacing } from '@/theme';

// 공연장 찾기: 지역으로 거르고 이름으로 검색해서, 가나다순 목록에서 고른다
export default function VenuesScreen() {
  const headerHeight = useHeaderHeight();
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
      <View style={styles.search}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
        <TextInput
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

  return (
    <SectionList
      style={styles.list}
      sections={sections.list}
      keyExtractor={(item) => String(item.id)}
      stickySectionHeadersEnabled
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      ListHeaderComponent={header}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <AppText weight="extrabold" size={15} color={colors.brand}>
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
          <AppText color={colors.textMuted} size={16} style={[styles.state, styles.center]}>
            {error ? '공연장 목록을 불러오지 못했어요.\n아래로 당겨서 다시 시도해보세요.' : '조건에 맞는 공연장이 없어요.'}
          </AppText>
        )
      }
    />
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
        <AppText weight="bold" size={17} numberOfLines={1}>
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
      <AppText size={20} color={colors.textMuted}>
        ›
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 52, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sectionHeader: { paddingVertical: 8, backgroundColor: colors.pageBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm + 2, marginBottom: spacing.sm, borderRadius: 18, backgroundColor: colors.white },
  pressed: { opacity: 0.85 },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: colors.surface },
  noThumb: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  address: { lineHeight: 19 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: colors.surface, marginTop: 2 },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
});
