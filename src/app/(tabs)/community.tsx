import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import { TabHero } from '@/components/TabHero';
import { PostCard } from '@/components/PostCard';
import { POST_CATEGORY_LABEL, POST_SORTS, usePosts, type PostSort } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

const CATEGORIES = [{ value: '', label: '전체' }, ...Object.entries(POST_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))];

export default function CommunityScreen() {
  const { isLoggedIn } = useAuth();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<PostSort>('latest');
  // 입력 중인 글자와, 검색 버튼을 눌러 실제로 찾는 글자를 나눈다
  const [searchText, setSearchText] = useState('');
  const [keyword, setKeyword] = useState('');
  const { data, isPending, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, isRefetching } = usePosts(
    category,
    sort,
    keyword,
  );
  const posts = data?.pages.flatMap((page) => page.content) ?? [];

  const applySearch = (text: string) => {
    setSearchText(text);
    setKeyword(text.trim());
  };

  const handleWrite = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 글을 쓸 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    router.push({ pathname: '/community/write', params: category ? { category } : {} });
  };

  const header = (
    <View style={styles.header}>
      <TabHero
        title="커뮤니티"
        subtitle="같이 갈 사람, 후기, 질문을 나눠요"
      />
      <View style={styles.search}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => applySearch(searchText)}
          placeholder="제목, 내용, 공연명으로 검색"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          style={styles.searchInput}
        />
        {searchText ? (
          <Pressable onPress={() => applySearch('')} hitSlop={10} accessibilityLabel="검색어 지우기">
            <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.clearButton} size={20} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pills}>
        {CATEGORIES.map((c) => (
          <FilterPill key={c.value || 'all'} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </ScrollView>
      <View style={styles.sorts}>
        {POST_SORTS.map((s) => (
          <Pressable key={s.id} onPress={() => setSort(s.id)} hitSlop={6}>
            <AppText weight={sort === s.id ? 'bold' : 'medium'} size={14} color={sort === s.id ? colors.text : colors.textMuted}>
              {s.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PostCard post={item} />}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshing={isRefetching && !isFetchingNextPage}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isPending ? (
            <ActivityIndicator color={colors.brand} style={styles.state} />
          ) : keyword && !error ? (
            <EmptyState
              variant="empty"
              title="검색 결과가 없어요"
              description={`'${keyword}'에 맞는 글을 찾지 못했어요.`}
              actionLabel="검색어 지우기"
              onAction={() => applySearch('')}
            />
          ) : (
            <EmptyState
              variant={error ? 'error' : 'empty'}
              title={error ? '글을 불러오지 못했어요' : '아직 글이 없어요'}
              description={error ? '아래로 당겨서 다시 시도해보세요.' : '첫 글을 남겨보세요.'}
              actionLabel={error ? '다시 시도' : '글쓰기'}
              onAction={error ? () => refetch() : handleWrite}
            />
          )
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
      />

      {/* 글쓰기 */}
      <Pressable onPress={handleWrite} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} accessibilityRole="button" accessibilityLabel="글쓰기">
        <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={colors.white} size={22} />
        <AppText weight="bold" size={16} color={colors.white}>
          글쓰기
        </AppText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  list: { backgroundColor: colors.pageBg },
  content: { gap: spacing.ms, paddingHorizontal: spacing.md, paddingBottom: 100 },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  // 알약 줄은 화면 양끝까지 스크롤되도록 안쪽 여백만큼 바깥으로 넓힌다
  pillsScroll: { marginHorizontal: -spacing.md, flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.md },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  sorts: { flexDirection: 'row', gap: spacing.md },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
  footer: { marginVertical: spacing.lg },
  fabPressed: { backgroundColor: colors.brandStrong },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
});
