import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { FilterPill } from '@/components/FilterPill';
import { PostCard } from '@/components/PostCard';
import { POST_CATEGORY_LABEL, POST_SORTS, usePosts, type PostSort } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';

const CATEGORIES = [{ value: '', label: '전체' }, ...Object.entries(POST_CATEGORY_LABEL).map(([value, label]) => ({ value, label }))];

export default function CommunityScreen() {
  const { isLoggedIn } = useAuth();
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState<PostSort>('latest');
  const { data, isPending, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch, isRefetching } = usePosts(category, sort);
  const posts = data?.pages.flatMap((page) => page.content) ?? [];

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
      <AppText weight="extrabold" size={28}>
        커뮤니티
      </AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pills}>
        {CATEGORIES.map((c) => (
          <FilterPill key={c.value || 'all'} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} />
        ))}
      </ScrollView>
      <View style={styles.sorts}>
        {POST_SORTS.map((s) => (
          <Pressable key={s.id} onPress={() => setSort(s.id)} hitSlop={6}>
            <AppText weight={sort === s.id ? 'bold' : 'medium'} size={15} color={sort === s.id ? colors.text : colors.textMuted}>
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
          ) : (
            <AppText color={colors.textMuted} size={16} style={[styles.state, styles.center]}>
              {error ? '글을 불러오지 못했어요.\n아래로 당겨서 다시 시도해보세요.' : '아직 글이 없어요.\n첫 글을 남겨보세요.'}
            </AppText>
          )
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
      />

      {/* 글쓰기 */}
      <Pressable onPress={handleWrite} style={styles.fab} accessibilityRole="button" accessibilityLabel="글쓰기">
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
  content: { gap: spacing.sm + 2, paddingHorizontal: spacing.md, paddingBottom: 100 },
  header: { gap: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm },
  // 알약 줄은 화면 양끝까지 스크롤되도록 안쪽 여백만큼 바깥으로 넓힌다
  pillsScroll: { marginHorizontal: -spacing.md, flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.md },
  sorts: { flexDirection: 'row', gap: spacing.md },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
  footer: { marginVertical: spacing.lg },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
});
