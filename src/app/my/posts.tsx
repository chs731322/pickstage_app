import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import { ReviewFormSheet } from '@/components/ReviewFormSheet';
import { POST_CATEGORY_LABEL } from '@/features/community';
import {
  useDeleteMyReview,
  useMyPosts,
  useMyReviews,
  useUpdateMyReview,
  type MyPost,
  type MyReview,
} from '@/features/me';
import { errorMessage } from '@/lib/api';
import { colors, spacing } from '@/theme';

const REVIEW_FILTER = 'venue_review';
const FILTERS = [
  { value: '', label: '전체' },
  ...Object.entries(POST_CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
  { value: REVIEW_FILTER, label: '공연장 후기' },
];

const formatDate = (value: string | null) => (value ? value.slice(0, 10).replaceAll('-', '.') : '');

// 내가 쓴 글: 커뮤니티 글(카테고리별)과 공연장 후기를 최신순으로 모아 본다
export default function MyPostsScreen() {
  const headerHeight = useHeaderHeight();
  const [category, setCategory] = useState('');
  const isReviews = category === REVIEW_FILTER;
  const posts = useMyPosts(isReviews ? '' : category);
  const reviews = useMyReviews(isReviews);
  const list = isReviews ? reviews : posts;

  const [editing, setEditing] = useState<MyReview | null>(null);
  const updateReview = useUpdateMyReview();
  const deleteReview = useDeleteMyReview();

  // 글과 후기는 모양이 달라서, 한 목록처럼 다루려고 합친 타입으로 본다
  const pages = (list.data?.pages ?? []) as { content: (MyPost | MyReview)[]; totalElements: number }[];
  const items = pages.flatMap((page) => page.content);
  const total = pages[0]?.totalElements ?? 0;

  const confirmDelete = (review: MyReview) =>
    Alert.alert('후기를 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          deleteReview.mutate(review.id, {
            onError: (e) => Alert.alert('삭제하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
          }),
      },
    ]);

  const header = (
    <View style={styles.header}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pills}>
        {FILTERS.map((filter) => (
          <FilterPill key={filter.value || 'all'} label={filter.label} active={category === filter.value} onPress={() => setCategory(filter.value)} />
        ))}
      </ScrollView>
      {total > 0 ? (
        <AppText size={14} color={colors.textMuted}>
          총 {total}개
        </AppText>
      ) : null}
    </View>
  );

  return (
    <>
      <FlatList<MyPost | MyReview>
        style={styles.list}
        data={items}
        keyExtractor={(item) => `${isReviews ? 'r' : 'p'}${item.id}`}
        contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
        ListHeaderComponent={header}
        renderItem={({ item }) =>
          isReviews ? (
            <ReviewCard review={item as MyReview} onEdit={() => setEditing(item as MyReview)} onDelete={() => confirmDelete(item as MyReview)} />
          ) : (
            <PostCard post={item as MyPost} />
          )
        }
        onEndReached={() => {
          if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
        }}
        onEndReachedThreshold={0.6}
        refreshing={list.isRefetching && !list.isFetchingNextPage}
        onRefresh={list.refetch}
        ListEmptyComponent={
          list.isPending ? (
            <ActivityIndicator color={colors.brand} style={styles.state} />
          ) : (
            <EmptyState
              variant={list.error ? 'error' : 'empty'}
              title={
                list.error
                  ? '글을 불러오지 못했어요'
                  : isReviews
                    ? '아직 작성한 후기가 없어요'
                    : category
                      ? '이 카테고리에 쓴 글이 아직 없어요'
                      : '아직 쓴 글이 없어요'
              }
              description={list.error ? '아래로 당겨서 다시 시도해보세요.' : !isReviews && !category ? '커뮤니티에서 첫 글을 남겨보세요.' : undefined}
            />
          )
        }
        ListFooterComponent={list.isFetchingNextPage ? <ActivityIndicator color={colors.brand} style={styles.footer} /> : undefined}
      />

      {editing ? (
        <ReviewFormSheet
          key={editing.id}
          title={`${editing.venueName} 후기 수정`}
          visible
          initial={{
            rating: editing.rating,
            content: editing.content,
            seatSection: editing.seatSection,
            viewInfo: editing.viewInfo,
            standingTip: editing.standingTip,
          }}
          submitLabel="저장"
          successMessage="후기를 수정했어요"
          onClose={() => setEditing(null)}
          onSubmit={(values) => updateReview.mutateAsync({ id: editing.id, ...values })}
        />
      ) : null}
    </>
  );
}

function PostCard({ post }: { post: MyPost }) {
  return (
    <Pressable onPress={() => router.push(`/community/${post.id}`)} style={styles.card} accessibilityRole="button">
      <View style={styles.cardHead}>
        <View style={styles.tag}>
          <AppText weight="bold" size={12} color={colors.brand}>
            {POST_CATEGORY_LABEL[post.category] ?? post.category}
          </AppText>
        </View>
        {post.festivalTitle ? (
          <AppText size={13} color={colors.textMuted} numberOfLines={1} style={styles.flex}>
            {post.festivalTitle}
          </AppText>
        ) : null}
      </View>
      <AppText weight="bold" size={17} numberOfLines={2} style={styles.title}>
        {post.title}
      </AppText>
      <AppText size={13} color={colors.textMuted}>
        {formatDate(post.createdAt)} · 조회 {post.viewCount} · 좋아요 {post.likeCount} · 댓글 {post.commentCount}
      </AppText>
    </Pressable>
  );
}

function ReviewCard({ review, onEdit, onDelete }: { review: MyReview; onEdit: () => void; onDelete: () => void }) {
  const extra = [review.seatSection, review.viewInfo, review.standingTip].filter(Boolean).join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <AppText weight="bold" size={16} numberOfLines={1} style={styles.flex}>
          {review.venueName}
        </AppText>
        <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor="#ffb400" size={15} />
        <AppText weight="bold" size={15}>
          {review.rating.toFixed(1)}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {formatDate(review.createdAt)}
        </AppText>
      </View>
      <AppText size={16} style={styles.reviewContent}>
        {review.content}
      </AppText>
      {extra ? (
        <AppText size={14} color={colors.textMuted}>
          {extra}
        </AppText>
      ) : null}
      <View style={styles.actions}>
        <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button">
          <AppText weight="semibold" size={14} color={colors.textSecondary}>
            수정
          </AppText>
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button">
          <AppText weight="semibold" size={14} color={colors.danger}>
            삭제
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
  header: { gap: spacing.md, paddingBottom: spacing.sm },
  // 알약 줄은 화면 양끝까지 스크롤되도록 안쪽 여백만큼 바깥으로 넓힌다
  pillsScroll: { marginHorizontal: -spacing.md, flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.md },
  card: { gap: spacing.sm, padding: spacing.md + 2, borderRadius: 18, backgroundColor: colors.white },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.brandSoft },
  title: { lineHeight: 24 },
  reviewContent: { lineHeight: 24 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, paddingTop: spacing.xs },
  state: { marginTop: spacing.xl },
  center: { textAlign: 'center', lineHeight: 24 },
  footer: { marginVertical: spacing.lg },
});
