import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FilterPill } from '@/components/FilterPill';
import { PosterCard } from '@/components/PosterCard';
import { PostCard } from '@/components/PostCard';
import { ReportBlockMenu } from '@/components/ReportBlockMenu';
import { Screen } from '@/components/Screen';
import type { Privacy, MyReview } from '@/features/me';
import { useUserArtists, useUserBookmarks, useUserPosts, useUserProfile, useUserReviews, type UserProfile } from '@/features/profile';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius, spacing } from '@/theme';

type TabKey = 'bookmarks' | 'artists' | 'posts' | 'reviews';

const TABS: { key: TabKey; label: string; flag: keyof Privacy }[] = [
  { key: 'bookmarks', label: '찜한 공연', flag: 'showBookmarks' },
  { key: 'artists', label: '관심 아티스트', flag: 'showArtists' },
  { key: 'posts', label: '쓴 글', flag: 'showPosts' },
  { key: 'reviews', label: '공연장 후기', flag: 'showReviews' },
];

// 다른 사용자의 프로필 (로그인 필요): 찜한 공연·관심 아티스트·쓴 글·공연장 후기. 상대가 비공개로 한 항목은 잠금으로 보인다.
export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const { data: user, isPending, error } = useUserProfile(id);

  if (!isLoggedIn) {
    return (
      <Screen topInset={false}>
        <View style={styles.notice}>
          <AppText weight="bold" size={18}>
            로그인하면 프로필을 볼 수 있어요
          </AppText>
          <Button title="로그인" onPress={() => router.push('/login')} />
        </View>
      </Screen>
    );
  }

  if (isPending) {
    return (
      <Screen topInset={false}>
        <ActivityIndicator color={colors.brand} style={styles.state} />
      </Screen>
    );
  }

  if (error || !user) {
    const message = errorMessage(error, '존재하지 않는 회원이에요.');
    return (
      <Screen topInset={false}>
        <View style={styles.notice}>
          <AppText weight="bold" size={18} style={styles.center}>
            {message}
          </AppText>
          {message.includes('차단') ? <Button title="차단한 사용자 관리" variant="secondary" onPress={() => router.push('/my/blocks')} /> : null}
          <Button title="뒤로가기" variant="secondary" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return <ProfileBody user={user} />;
}

function ProfileBody({ user }: { user: UserProfile }) {
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<TabKey>('bookmarks');
  const id = String(user.id);
  const current = TABS.find((t) => t.key === tab)!;
  // 본인은 비공개 항목도 볼 수 있다. 다른 회원에게 보이는지는 visible로 알려 준다.
  const canSee = user.self || user.visible[current.flag];
  const isPrivate = !user.visible[current.flag];

  const bookmarks = useUserBookmarks(id, tab === 'bookmarks' && canSee);
  const artists = useUserArtists(id, tab === 'artists' && canSee);
  const posts = useUserPosts(id, tab === 'posts' && canSee);
  const reviews = useUserReviews(id, tab === 'reviews' && canSee);

  const cardWidth = (width - spacing.md * 2 - 14) / 2;
  const artistWidth = (width - spacing.md * 2 - 12 * 2 - spacing.md * 2) / 3;
  const joined = user.createdAt ? `${user.createdAt.slice(0, 4)}.${user.createdAt.slice(5, 7)} 가입` : '';

  return (
    <Screen topInset={false}>
      {/* 프로필 머리 */}
      <View style={styles.head}>
        <Avatar uri={user.profileImage} name={user.nickname} size={84} />
        <View style={styles.headText}>
          <AppText weight="bold" size={18}>
            {user.nickname}
          </AppText>
          {joined ? (
            <AppText size={14} color={colors.textMuted}>
              {joined}
            </AppText>
          ) : null}
        </View>
        {user.self ? (
          <Pressable onPress={() => router.push('/my/profile')} hitSlop={8} accessibilityRole="button">
            <AppText weight="semibold" size={14} color={colors.brand}>
              회원정보 수정
            </AppText>
          </Pressable>
        ) : (
          <ReportBlockMenu targetType="USER" targetId={user.id} authorId={user.id} authorName={user.nickname} onBlocked={() => router.back()} />
        )}
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <FilterPill key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>

      {/* 잠금 안내 */}
      {!canSee ? (
        <View style={styles.lock}>
          <SymbolView name={{ ios: 'lock', android: 'lock', web: 'lock' }} tintColor={colors.textMuted} size={22} />
          <AppText color={colors.textMuted} size={14} style={styles.center}>
            {user.nickname}님이 비공개로 설정한 항목이에요.
          </AppText>
        </View>
      ) : null}
      {canSee && user.self && isPrivate ? (
        <AppText size={13} color={colors.textMuted}>
          🔒 비공개 항목이에요. 나만 볼 수 있고, 다른 회원에게는 잠금으로 보여요.
        </AppText>
      ) : null}

      {/* 내용 */}
      {canSee && tab === 'bookmarks' ? (
        <Section state={bookmarks} emptyText="찜한 공연이 없어요.">
          <View style={styles.grid}>
            {bookmarks.data?.map((f) => <PosterCard key={f.id} festival={f} width={cardWidth} />)}
          </View>
        </Section>
      ) : null}

      {canSee && tab === 'artists' ? (
        <Section state={artists} emptyText="관심 아티스트가 없어요.">
          <View style={styles.artistGrid}>
            {artists.data?.map((a) => (
              <Pressable key={a.id} onPress={() => router.push(`/artist/${a.id}`)} style={{ width: artistWidth }} accessibilityRole="button">
                <Avatar uri={a.profileImage} name={a.name} size={artistWidth} />
                <AppText weight="semibold" size={14} numberOfLines={2} style={styles.artistName}>
                  {a.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {canSee && tab === 'posts' ? (
        <Section state={{ ...posts, data: posts.data?.pages.flatMap((p) => p.content) }} emptyText="쓴 글이 없어요.">
          <View style={styles.list}>{posts.data?.pages.flatMap((p) => p.content).map((p) => <PostCard key={p.id} post={p} />)}</View>
          <MoreButton query={posts} />
        </Section>
      ) : null}

      {canSee && tab === 'reviews' ? (
        <Section state={{ ...reviews, data: reviews.data?.pages.flatMap((p) => p.content) }} emptyText="쓴 공연장 후기가 없어요.">
          <View style={styles.list}>{reviews.data?.pages.flatMap((p) => p.content).map((r) => <ReviewCard key={r.id} review={r} />)}</View>
          <MoreButton query={reviews} />
        </Section>
      ) : null}
    </Screen>
  );
}

// 불러오는 중 / 비어 있음 / 오류 / 내용
function Section({ state, emptyText, children }: { state: { isPending: boolean; error: unknown; data?: unknown[] }; emptyText: string; children: React.ReactNode }) {
  if (state.isPending) return <ActivityIndicator color={colors.brand} style={styles.state} />;
  if (state.error) {
    return (
      <AppText color={colors.textMuted} size={14} style={styles.center}>
        불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </AppText>
    );
  }
  if (!state.data || state.data.length === 0) {
    return (
      <AppText color={colors.textMuted} size={14} style={[styles.state, styles.center]}>
        {emptyText}
      </AppText>
    );
  }
  return <>{children}</>;
}

function MoreButton({ query }: { query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown } }) {
  if (!query.hasNextPage) return null;
  return (
    <Button title={query.isFetchingNextPage ? '불러오는 중...' : '더보기'} variant="secondary" onPress={() => query.fetchNextPage()} loading={query.isFetchingNextPage} />
  );
}

function ReviewCard({ review }: { review: MyReview }) {
  const extra = [review.seatSection, review.viewInfo, review.standingTip].filter(Boolean).join(' · ');
  return (
    <View style={styles.review}>
      <View style={styles.reviewTop}>
        <AppText weight="bold" size={16} numberOfLines={1} style={styles.flex}>
          {review.venueName}
        </AppText>
        <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={colors.star} size={15} />
        <AppText weight="bold" size={14}>
          {review.rating.toFixed(1)}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {review.createdAt ? review.createdAt.slice(0, 10).replaceAll('-', '.') : ''}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.card },
  state: { marginTop: spacing.lg },
  center: { textAlign: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card },
  headText: { flex: 1, gap: 2 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  lock: { alignItems: 'center', gap: spacing.sm, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.card },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.ms },
  artistGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.ms, paddingHorizontal: spacing.md },
  artistName: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 19 },
  list: { gap: spacing.ms },
  review: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewContent: { lineHeight: 24 },
});
