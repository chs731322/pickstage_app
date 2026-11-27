import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Avatar } from '@/components/Avatar';
import { useArtistList, type ArtistListItem } from '@/features/artists';
import { nameGroupOf } from '@/lib/koreanGroup';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

// 아티스트 찾기: 예정된 공연에 출연하는 아티스트를 가나다순으로 보고, 이름으로 검색한다
export default function ArtistsScreen() {
  const headerHeight = useHeaderHeight();
  const [query, setQuery] = useState('');
  const { data, isPending, error, refetch, isRefetching } = useArtistList();

  const sections = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const filtered = (data ?? []).filter(
      (a) => !keyword || a.name.toLowerCase().includes(keyword) || (a.englishName ?? '').toLowerCase().includes(keyword),
    );
    const groups = new Map<string, ArtistListItem[]>();
    filtered.forEach((a) => {
      const key = nameGroupOf(a.name);
      groups.set(key, [...(groups.get(key) ?? []), a]);
    });
    return { total: filtered.length, list: [...groups.entries()].map(([title, items]) => ({ title, data: items })) };
  }, [data, query]);

  const header = (
    <View style={styles.header}>
      <View style={styles.search}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={query}
          onChangeText={setQuery}
          placeholder="아티스트 이름으로 찾기"
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
      {!isPending && !error ? (
        <AppText size={14} color={colors.textMuted}>
          예정된 공연에 출연하는 아티스트 {sections.total}팀
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
          <AppText weight="bold" size={14} color={colors.brand}>
            {section.title}
          </AppText>
        </View>
      )}
      renderItem={({ item }) => <ArtistRow artist={item} />}
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
            title={error ? '아티스트 목록을 불러오지 못했어요' : '찾는 아티스트가 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : '이름을 다시 확인해보세요.'}
          />
        )
      }
    />
  );
}

function ArtistRow({ artist }: { artist: ArtistListItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/artist/${artist.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${artist.name} 아티스트 보기`}>
      <Avatar uri={artist.profileImage} name={artist.name} size={56} />
      <View style={styles.info}>
        <AppText weight="bold" size={16} numberOfLines={1}>
          {artist.name}
        </AppText>
        {artist.englishName && artist.englishName !== artist.name ? (
          <AppText size={13} color={colors.textMuted} numberOfLines={1}>
            {artist.englishName}
          </AppText>
        ) : null}
      </View>
      <View style={styles.count}>
        <AppText weight="bold" size={12} color={colors.brand}>
          예정 공연 {artist.upcomingCount}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  sectionHeader: { paddingVertical: spacing.sm, backgroundColor: colors.pageBg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.ms, marginBottom: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.white },
  pressed: { opacity: 0.85 },
  info: { flex: 1, gap: 2 },
  count: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
});
