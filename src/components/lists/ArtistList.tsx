import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View, type FlatListInstance } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { TOP_BUTTON_OFFSET, ToTopButton } from '@/components/ToTopButton';
import { Avatar } from '@/components/Avatar';
import { useArtistList, type ArtistListItem } from '@/features/artists';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

const COLUMNS = 3;
const GAP = 14;

// 아티스트 목록: 예정된 공연에 출연하는 아티스트를 가나다순의 3열 사진으로 보고, 이름으로 검색한다
// title: 맨 위에 놓을 제목 영역(탭에서 쓸 때), topPadding: 위에 비워둘 높이
export function ArtistList({ title, topPadding = 0 }: { title?: ReactNode; topPadding?: number }) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatListInstance>(null);
  const [showTop, setShowTop] = useState(false);
  const [query, setQuery] = useState('');
  const { data, isPending, error, refetch, isRefetching } = useArtistList();

  const artists = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return (data ?? []).filter(
      (a) => !keyword || a.name.toLowerCase().includes(keyword) || (a.englishName ?? '').toLowerCase().includes(keyword),
    );
  }, [data, query]);
  const itemWidth = Math.floor((width - spacing.md * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const header = (
    <View style={styles.header}>
      {title}
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
          {artists.length}팀
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View style={styles.list}>
      <FlatList
        ref={listRef}
        style={styles.list}
        data={artists}
        keyExtractor={(item) => String(item.id)}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.column}
        scrollEventThrottle={100}
        onScroll={(event) => setShowTop(event.nativeEvent.contentOffset.y > TOP_BUTTON_OFFSET)}
        contentContainerStyle={[styles.content, { paddingTop: topPadding }]}
        ListHeaderComponent={header}
        renderItem={({ item }) => <ArtistCell artist={item} size={itemWidth} />}
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
      {showTop && artists.length > 0 ? <ToTopButton onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} /> : null}
    </View>
  );
}

function ArtistCell({ artist, size }: { artist: ArtistListItem; size: number }) {
  return (
    <Pressable
      onPress={() => router.push(`/artist/${artist.id}`)}
      style={({ pressed }) => [styles.cell, { width: size }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${artist.name} 아티스트 보기`}>
      <Avatar uri={artist.profileImage} name={artist.name} size={size} />
      <AppText weight="medium" size={13} numberOfLines={1} style={styles.name}>
        {artist.name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md, paddingBottom: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.card },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  column: { gap: GAP, marginBottom: spacing.md },
  cell: { alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.85 },
  name: { alignSelf: 'stretch', textAlign: 'center' },
  state: { marginTop: spacing.xl },
});
