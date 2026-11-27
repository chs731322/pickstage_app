import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { isPinnedNotice, useNotices, type NoticeListItem } from '@/features/notices';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

// 공지사항: 제목·내용으로 검색하고, 고정된 공지는 맨 위에 보인다. 누르면 상세로 간다.
export default function NoticesScreen() {
  const headerHeight = useHeaderHeight();
  // 입력하는 동안은 입력칸에만 두고, 검색(키보드의 확인)을 눌렀을 때 목록에 적용한다
  const [text, setText] = useState('');
  const [keyword, setKeyword] = useState('');
  const { data, isPending, error, refetch, isRefetching, hasNextPage, isFetchingNextPage, fetchNextPage } = useNotices(keyword);

  const items = data?.pages.flatMap((page) => page.content) ?? [];

  const header = (
    <View style={styles.search}>
      <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
      <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
        value={text}
        onChangeText={setText}
        onSubmitEditing={() => setKeyword(text)}
        placeholder="제목이나 내용으로 찾기"
        placeholderTextColor={colors.textMuted}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
      />
      {text ? (
        <Pressable
          onPress={() => {
            setText('');
            setKeyword('');
          }}
          hitSlop={10}
          accessibilityLabel="검색어 지우기">
          <SymbolView name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} tintColor={colors.clearButton} size={20} />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      ListHeaderComponent={header}
      renderItem={({ item }) => <NoticeRow notice={item} />}
      ItemSeparatorComponent={() => <View style={styles.gap} />}
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
            title={error ? '공지사항을 불러오지 못했어요' : keyword ? '검색 결과가 없어요' : '등록된 공지사항이 없어요'}
            description={error ? '아래로 당겨서 다시 시도해보세요.' : keyword ? '다른 검색어로 다시 시도해보세요.' : undefined}
          />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
    />
  );
}

function NoticeRow({ notice }: { notice: NoticeListItem }) {
  const pinned = isPinnedNotice(notice);
  return (
    <Pressable
      onPress={() => router.push(`/notice/${notice.id}`)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${notice.title} 공지 보기`}>
      <View style={styles.info}>
        <View style={styles.meta}>
          {pinned ? (
            <View style={styles.pin}>
              <AppText weight="bold" size={12} color={colors.brand}>
                고정
              </AppText>
            </View>
          ) : null}
          <AppText size={13} color={colors.textMuted}>
            {notice.createdAt?.slice(0, 10)}
          </AppText>
        </View>
        <AppText weight="bold" size={16} numberOfLines={2} style={styles.title}>
          {notice.title}
        </AppText>
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
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  gap: { height: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  pressed: { opacity: 0.7 },
  info: { flex: 1, gap: spacing.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pin: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  title: { lineHeight: 24 },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center' },
  footer: { marginVertical: spacing.lg },
});
