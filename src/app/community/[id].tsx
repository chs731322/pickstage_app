import { router, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CommentItem } from '@/components/CommentItem';
import { PostBody } from '@/components/PostBody';
import { ReportBlockMenu } from '@/components/ReportBlockMenu';
import {
  POST_CATEGORY_LABEL,
  useCommentMutations,
  useDeletePost,
  usePost,
  useTogglePostLike,
  type Comment,
  type PostDetail,
} from '@/features/community';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { SITE_URL } from '@/lib/links';
import { timeAgo } from '@/lib/postContent';
import { colors, fontFamily, radius, spacing } from '@/theme';

export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isPending, error, refetch } = usePost(id);
  const headerHeight = useHeaderHeight();
  const topPadding = Platform.OS === 'ios' ? headerHeight : 0;

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <AppText weight="bold" size={20}>
          글을 찾을 수 없어요
        </AppText>
        <AppText color={colors.textMuted} size={16} style={styles.centerText}>
          삭제되었거나 잠시 불러오지 못했어요.
        </AppText>
        <View style={styles.retry}>
          <Button title="다시 시도" onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  return <PostBodyScreen post={post} topPadding={topPadding} />;
}

function PostBodyScreen({ post, topPadding }: { post: PostDetail; topPadding: number }) {
  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuth();
  const isMine = post.authorId !== null && post.authorId === user?.id;
  const like = useTogglePostLike(post.id);
  const deletePost = useDeletePost();
  const { create, update, remove } = useCommentMutations(post.id);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);

  // 최상위 댓글(오래된 순)과 그 아래 답글
  const { topLevel, repliesByParent, total } = useMemo(() => {
    const visible = (post.comments ?? []).filter((c) => c.authorId == null || !blockedIds.includes(c.authorId));
    const byTime = (a: Comment, b: Comment) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id;
    const replies = new Map<number, Comment[]>();
    visible
      .filter((c) => c.parentId)
      .sort(byTime)
      .forEach((c) => replies.set(c.parentId!, [...(replies.get(c.parentId!) ?? []), c]));
    return { topLevel: visible.filter((c) => !c.parentId).sort(byTime), repliesByParent: replies, total: visible.length };
  }, [post.comments, blockedIds]);

  const requireLogin = (message: string) => {
    if (isLoggedIn) return true;
    Alert.alert('로그인이 필요해요', message, [
      { text: '취소', style: 'cancel' },
      { text: '로그인', onPress: () => router.push('/login') },
    ]);
    return false;
  };

  const handleLike = () => {
    if (!requireLogin('로그인하면 좋아요를 누를 수 있어요.')) return;
    like.mutate(post.liked, { onError: () => Alert.alert('처리하지 못했어요', '잠시 후 다시 시도해주세요.') });
  };

  const handleSubmitComment = () => {
    if (!requireLogin('로그인하면 댓글을 쓸 수 있어요.')) return;
    const content = draft.trim();
    if (!content) return;
    create.mutate(
      { content, parentId: replyTo?.id },
      {
        onSuccess: () => {
          setDraft('');
          setReplyTo(null);
        },
        onError: (e) => Alert.alert('댓글을 등록하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
      },
    );
  };

  const confirmDeleteComment = (comment: Comment) =>
    Alert.alert('댓글을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => remove.mutate(comment.id, { onError: (e) => Alert.alert('삭제하지 못했어요', errorMessage(e)) }),
      },
    ]);

  const openOwnerMenu = () =>
    Alert.alert('내 글', undefined, [
      { text: '수정', onPress: () => router.push({ pathname: '/community/write', params: { id: String(post.id) } }) },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () =>
          Alert.alert('글을 삭제할까요?', '삭제하면 되돌릴 수 없어요.', [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제',
              style: 'destructive',
              onPress: () =>
                deletePost.mutate(post.id, {
                  onSuccess: () => router.back(),
                  onError: (e) => Alert.alert('삭제하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
                }),
            },
          ]),
      },
      { text: '취소', style: 'cancel' },
    ]);

  const handleShare = () =>
    Share.share({ message: `${post.title} — PICKSTAGE 커뮤니티\n${SITE_URL}/community/${post.id}` });

  const startReply = (comment: Comment) => {
    if (!requireLogin('로그인하면 답글을 쓸 수 있어요.')) return;
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPadding + spacing.md }]}>
        {/* 글머리 */}
        <View style={styles.tags}>
          <View style={styles.tag}>
            <AppText weight="bold" size={13} color={colors.brand}>
              {POST_CATEGORY_LABEL[post.category] ?? post.category}
            </AppText>
          </View>
          {post.festivalId && post.festivalTitle ? (
            <Pressable onPress={() => router.push(`/festival/${post.festivalId}`)} style={styles.festivalTag} hitSlop={6}>
              <AppText weight="semibold" size={13} color={colors.textSecondary} numberOfLines={1}>
                {post.festivalTitle} ›
              </AppText>
            </Pressable>
          ) : null}
        </View>
        <AppText weight="extrabold" size={24} style={styles.title}>
          {post.title}
        </AppText>

        <View style={styles.author}>
          <Avatar uri={post.authorProfileImage} name={post.authorNickname ?? '탈'} size={40} />
          <View style={styles.flex}>
            <AppText weight="bold" size={16}>
              {post.authorNickname ?? '탈퇴한 회원'}
            </AppText>
            <AppText size={13} color={colors.textMuted}>
              {timeAgo(post.createdAt)} · 조회 {post.viewCount}
            </AppText>
          </View>
          {isMine ? (
            <Pressable onPress={openOwnerMenu} hitSlop={12} accessibilityLabel="내 글 메뉴">
              <SymbolView name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} tintColor={colors.textMuted} size={22} />
            </Pressable>
          ) : (
            <ReportBlockMenu
              targetType="POST"
              targetId={post.id}
              authorId={post.authorId}
              authorName={post.authorNickname ?? undefined}
              onBlocked={() => router.back()}
            />
          )}
        </View>

        <View style={styles.divider} />
        <PostBody content={post.content} />

        {/* 좋아요, 공유 */}
        <View style={styles.reactions}>
          <Pressable onPress={handleLike} style={[styles.likeButton, post.liked && styles.likeButtonActive]} accessibilityRole="button" accessibilityState={{ selected: post.liked }}>
            <SymbolView
              name={post.liked ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
              tintColor={post.liked ? colors.white : colors.brand}
              size={20}
            />
            <AppText weight="bold" size={16} color={post.liked ? colors.white : colors.brand}>
              {post.likeCount}
            </AppText>
          </Pressable>
          <Pressable onPress={handleShare} style={styles.shareButton} accessibilityRole="button" accessibilityLabel="공유">
            <SymbolView name={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} tintColor={colors.text} size={20} />
          </Pressable>
        </View>

        {/* 댓글 */}
        <View style={styles.commentsHeader}>
          <AppText weight="extrabold" size={20}>
            댓글
          </AppText>
          <AppText weight="bold" size={18} color={colors.brand}>
            {total}
          </AppText>
        </View>
        {topLevel.length === 0 ? (
          <AppText size={15} color={colors.textMuted} style={styles.noComments}>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요.
          </AppText>
        ) : (
          topLevel.map((comment) => (
            <View key={comment.id}>
              <CommentItem
                comment={comment}
                isMine={comment.authorId !== null && comment.authorId === user?.id}
                onReply={() => startReply(comment)}
                onSaveEdit={(content) => update.mutateAsync({ id: comment.id, content }).catch((e) => { Alert.alert('수정하지 못했어요', errorMessage(e)); throw e; })}
                onDelete={() => confirmDeleteComment(comment)}
                onBlocked={(userId) => setBlockedIds((prev) => [...prev, userId])}
              />
              {(repliesByParent.get(comment.id) ?? []).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply
                  isMine={reply.authorId !== null && reply.authorId === user?.id}
                  onSaveEdit={(content) => update.mutateAsync({ id: reply.id, content }).catch((e) => { Alert.alert('수정하지 못했어요', errorMessage(e)); throw e; })}
                  onDelete={() => confirmDeleteComment(reply)}
                  onBlocked={(userId) => setBlockedIds((prev) => [...prev, userId])}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* 댓글 쓰기 */}
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        {replyTo ? (
          <View style={styles.replyBanner}>
            <AppText size={13} color={colors.textSecondary} numberOfLines={1} style={styles.flex}>
              {replyTo.authorNickname ?? '탈퇴한 회원'}님에게 답글 쓰는 중
            </AppText>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={10} accessibilityLabel="답글 취소">
              <AppText weight="bold" size={16} color={colors.textMuted}>
                ✕
              </AppText>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.composerRow}>
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            placeholder={isLoggedIn ? '댓글을 입력해주세요' : '로그인하고 댓글을 남겨보세요'}
            placeholderTextColor={colors.textMuted}
            editable={isLoggedIn}
            multiline
            maxLength={1000}
            style={styles.composerInput}
            onPressIn={() => {
              if (!isLoggedIn) requireLogin('로그인하면 댓글을 쓸 수 있어요.');
            }}
          />
          <Pressable
            onPress={handleSubmitComment}
            disabled={create.isPending || !draft.trim()}
            style={[styles.send, (!draft.trim() || create.isPending) && styles.sendDisabled]}
            accessibilityRole="button"
            accessibilityLabel="댓글 등록">
            <AppText weight="bold" size={15} color={colors.white}>
              {create.isPending ? '...' : '등록'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.background },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  festivalTag: { flexShrink: 1, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  title: { lineHeight: 33 },
  author: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  reactions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.white,
  },
  likeButtonActive: { backgroundColor: colors.brand },
  shareButton: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  commentsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg },
  noComments: { paddingVertical: spacing.md },
  composer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, gap: 6 },
  replyBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: 4 },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
  },
  send: { height: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
});
