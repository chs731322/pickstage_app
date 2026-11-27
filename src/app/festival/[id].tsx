import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  type ScrollViewInstance,
  Share,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ConcertTicket } from '@/components/ConcertTicket';
import { LineupSection } from '@/components/LineupSection';
import { HeaderIcon, STICKY_HEADER_HEIGHT, StickyHeader } from '@/components/StickyHeader';
import { CustomNotificationSheet } from '@/components/CustomNotificationSheet';
import { PosterCard } from '@/components/PosterCard';
import { ReviewHighlightCard } from '@/components/ReviewHighlightCard';
import { TOP_BUTTON_OFFSET, ToTopButton } from '@/components/ToTopButton';
import { useBookmarks, useToggleBookmark } from '@/features/bookmarks';
import { useFestival, useRelatedFestivals, type FestivalDetail } from '@/features/festivals';
import { useAuth } from '@/lib/auth';
import { daysUntil, festivalStatus, formatOpenAt } from '@/lib/format';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { SITE_URL } from '@/lib/links';
import { colors, radius, spacing } from '@/theme';

const BOTTOM_BAR_HEIGHT = 72;

type Ticket = NonNullable<FestivalDetail['tickets']>[number];

// 처음에 보여줄 티켓 종류 수
const TICKET_PREVIEW_COUNT = 3;

// 예매 버튼이 열 링크: 예매처별 링크가 있으면 그것들, 없으면 공연의 기본 예매 링크
function bookingOptions(festival: FestivalDetail): { vendor: string; url: string }[] {
  const seen = new Map<string, { vendor: string; url: string }>();
  (festival.tickets ?? []).forEach((t) => {
    if (t.bookingUrl && !seen.has(t.bookingUrl)) seen.set(t.bookingUrl, { vendor: t.vendorName ?? '예매처', url: t.bookingUrl });
  });
  if (seen.size === 0 && festival.ticketLink) seen.set(festival.ticketLink, { vendor: '예매처', url: festival.ticketLink });
  return [...seen.values()];
}

type BookAction =
  | { kind: 'book'; title: string }
  // 눌러서 공식 사이트로 간다
  | { kind: 'external'; title: string }
  // 안내만 보여주고 누를 수 없다
  | { kind: 'info'; title: string };

// 아래 고정 버튼이 무엇을 할지 정한다 (예매 링크가 없다고 해서 모두 "준비 중"은 아니다)
function bookAction(festival: FestivalDetail, hasLinks: boolean, isEnded: boolean): BookAction {
  const tickets = festival.tickets ?? [];
  if (isEnded) return { kind: 'info', title: '예매 종료' };
  if (hasLinks) return { kind: 'book', title: '예매하러 가기' };
  // 링크는 없지만 모든 티켓이 무료면 예매가 필요 없는 공연
  if (tickets.length > 0 && tickets.every((t) => t.price === 0)) return { kind: 'info', title: '무료 입장' };
  // 아직 열리지 않은 티켓: 언제 열리는지 알려준다
  const openAt = festival.ticketOpenAt ?? tickets.map((t) => t.openAt).filter(Boolean).sort()[0] ?? null;
  if (openAt && new Date(openAt).getTime() > Date.now()) {
    const days = daysUntil(openAt);
    const when = days === null || days <= 0 ? '오늘' : `D-${days}`;
    return { kind: 'info', title: `${when} · ${formatOpenAt(openAt)} 오픈` };
  }
  if (festival.externalUrl) return { kind: 'external', title: '공식 사이트에서 확인하기' };
  return { kind: 'info', title: '예매 정보 준비 중' };
}

function openLink(url: string) {
  return WebBrowser.openBrowserAsync(url);
}

function formatPrice(price: number | null): string {
  if (price === null) return '가격 미정';
  return price === 0 ? '무료' : `${price.toLocaleString('ko-KR')}원`;
}

export default function FestivalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: festival, isPending, error, refetch } = useFestival(id);
  const insets = useSafeAreaInsets();
  // 고정 헤더가 내용 위에 떠 있어서, 그 높이만큼 아래에서 시작한다
  const topPadding = insets.top + STICKY_HEADER_HEIGHT;
  const [idleScroll] = useState(() => new Animated.Value(0));

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <StickyHeader title="" scrollY={idleScroll} />
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !festival) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <StickyHeader title="" scrollY={idleScroll} />
        <AppText weight="bold" size={18}>
          공연을 찾을 수 없어요
        </AppText>
        <AppText color={colors.textMuted} style={styles.centerText}>
          삭제되었거나 잠시 불러오지 못했어요.
        </AppText>
        <View style={styles.retry}>
          <Button title="다시 시도" onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  return <FestivalBody festival={festival} topPadding={topPadding} bottomInset={insets.bottom} />;
}

function FestivalBody({
  festival,
  topPadding,
  bottomInset,
}: {
  festival: FestivalDetail;
  topPadding: number;
  bottomInset: number;
}) {
  const { width } = useWindowDimensions();
  const { isLoggedIn } = useAuth();
  const [scrollY] = useState(() => new Animated.Value(0));
  const { data: bookmarks } = useBookmarks();
  const toggleBookmark = useToggleBookmark(festival.id);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [showTop, setShowTop] = useState(false);
  const { data: related } = useRelatedFestivals(festival);

  const isBookmarked = Boolean(bookmarks?.some((b) => b.id === festival.id));
  // 목록 카드와 같은 기준 (종료 / 진행 중 / D-n)
  const status = festivalStatus(festival.startDate, festival.endDate);
  const isEnded = status?.kind === 'ended';
  const genre = festivalGenreLabel(festival.genre);
  const options = useMemo(() => bookingOptions(festival), [festival]);
  const action = bookAction(festival, options.length > 0, isEnded);
  const lineup = festival.artists ?? [];
  const tickets = festival.tickets ?? [];

  const handleBook = () => {
    if (action.kind === 'external') {
      openLink(festival.externalUrl!);
      return;
    }
    if (action.kind !== 'book') return;
    if (options.length === 1) {
      openLink(options[0].url);
    } else {
      // 예매처가 여러 곳이면 고르게 한다
      Alert.alert('예매처를 선택해주세요', undefined, [
        ...options.map((o) => ({ text: o.vendor, onPress: () => openLink(o.url) })),
        { text: '취소', style: 'cancel' as const },
      ]);
    }
  };

  const handleBookmark = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 마음에 드는 공연을 찜할 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    toggleBookmark.mutate(isBookmarked, {
      onError: () => Alert.alert('처리하지 못했어요', '잠시 후 다시 시도해주세요.'),
    });
  };

  const handleNotify = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 원하는 시각에 알림을 받을 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setNotifyOpen(true);
  };

  // 공연을 연결한 후기 글쓰기 (연결해야 후기 하이라이트에 반영된다)
  const handleWriteReview = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 공연 후기를 쓸 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    router.push({
      pathname: '/community/write',
      params: { category: 'review', festivalId: String(festival.id), festivalTitle: festival.title },
    });
  };

  const handleShare = () =>
    Share.share({
      message: `${festival.title} — PICKSTAGE에서 확인해보세요.\n${SITE_URL}/performances/${festival.id}`,
    });

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => setShowTop(event.nativeEvent.contentOffset.y > TOP_BUTTON_OFFSET),
        })}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + bottomInset + spacing.lg }}>
        {/* 맨 위: 세로 티켓 (포스터, 점선, 제목과 날짜·지역·장소·티켓 오픈) */}
        <View style={[styles.hero, { paddingTop: topPadding + spacing.md }]}>
          <ConcertTicket festival={festival} status={status} genre={genre} width={width - spacing.md * 2} />
        </View>

        <View style={styles.sections}>
          {/* 공연 소개 */}
          {festival.description ? (
            <Card title="공연 소개">
              <AppText size={16} color={colors.textSecondary} style={styles.description}>
                {festival.description}
              </AppText>
            </Card>
          ) : null}

          {/* 예매 정보 */}
          {tickets.length > 0 || festival.ticketOpenAt ? (
            <Card title="예매 정보">
              {festival.ticketOpenAt ? (
                <AppText size={16} color={colors.textSecondary}>
                  티켓 오픈 <AppText weight="bold" size={16} color={colors.brand}>{formatOpenAt(festival.ticketOpenAt)}</AppText>
                </AppText>
              ) : null}
              <TicketList tickets={tickets} />
            </Card>
          ) : null}

          {/* 라인업 */}
          {lineup.length > 0 ? (
            <Card title={`라인업 ${lineup.length}`}>
              <LineupSection artists={lineup} contentWidth={width - (spacing.md) * 2 - spacing.md * 2} />
            </Card>
          ) : null}

          {/* 후기 하이라이트 (AI 요약) */}
          <ReviewHighlightCard target="festival" id={festival.id} onWrite={handleWriteReview} />
        </View>

        {/* 함께 볼만한 공연 */}
        {related && related.length > 0 ? (
          <View style={styles.related}>
            <AppText weight="bold" size={18} style={styles.relatedTitle}>
              함께 볼만한 공연
            </AppText>
            <FlatList
              data={related}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
              renderItem={({ item }) => <PosterCard festival={item} />}
            />
          </View>
        ) : null}
      </Animated.ScrollView>

      {/* 위에 고정되는 헤더: 뒤로 가기와 찜·공유·알림 */}
      <StickyHeader
        title={festival.title}
        scrollY={scrollY}
        right={
          <>
          <HeaderIcon
            label={isBookmarked ? '찜 취소' : '찜하기'}
            icon={isBookmarked ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            active={isBookmarked}
            onPress={handleBookmark}
          />
          <HeaderIcon label="공유" icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }} onPress={handleShare} />
          {!isEnded ? (
            <HeaderIcon label="알림 설정" icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }} onPress={handleNotify} />
          ) : null}
          {festival.externalUrl ? (
            <HeaderIcon label="공식 사이트" icon={{ ios: 'safari', android: 'public', web: 'public' }} onPress={() => openLink(festival.externalUrl!)} />
          ) : null}
          </>
        }
      />

      {/* 맨 위로: 한참 내렸을 때만 */}
      {showTop ? (
        <ToTopButton
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          bottom={BOTTOM_BAR_HEIGHT + bottomInset + spacing.md}
        />
      ) : null}

      {/* 아래에 고정된 예매 버튼 */}
      <View style={[styles.bottomBar, { paddingBottom: bottomInset + spacing.sm }]}>
        <Button
          title={action.title}
          disabled={action.kind === 'info'}
          onPress={handleBook}
          style={styles.bookButton}
        />
      </View>
      <CustomNotificationSheet
        festivalId={festival.id}
        startDate={festival.startDate}
        visible={notifyOpen}
        onClose={() => setNotifyOpen(false)}
      />
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <AppText weight="bold" size={18}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

// 티켓 종류가 많으면 처음 몇 개만 보여주고 나머지는 더보기로 펼친다 (라인업과 같은 방식)
function TicketList({ tickets }: { tickets: Ticket[] }) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = tickets.length > TICKET_PREVIEW_COUNT;
  const shown = expanded || !canExpand ? tickets : tickets.slice(0, TICKET_PREVIEW_COUNT);

  return (
    <>
      {shown.map((ticket, index) => (
        <TicketRow key={`${ticket.label}-${index}`} ticket={ticket} />
      ))}
      {canExpand ? (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.ticketMore} accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.textSecondary}>
            {expanded ? '접기' : `더보기 (${tickets.length - TICKET_PREVIEW_COUNT}개)`}
          </AppText>
        </Pressable>
      ) : null}
    </>
  );
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  return (
    <View style={styles.ticketRow}>
      <View style={styles.flex}>
        <AppText weight="bold" size={16}>
          {ticket.label}
        </AppText>
        <AppText size={13} color={colors.textMuted}>
          {[ticket.vendorName, ticket.openAt ? `${formatOpenAt(ticket.openAt)} 오픈` : null].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <AppText weight="bold" size={16}>
        {formatPrice(ticket.price)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.pageBg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.pageBg },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  hero: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  poster: { borderRadius: radius.lg, backgroundColor: colors.surface },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brand },
  tagEnded: { backgroundColor: colors.textMuted },
  tagLive: { backgroundColor: colors.text },
  tagOutline: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  title: { lineHeight: 30 },
  sections: { gap: spacing.md, padding: spacing.md, paddingTop: 0 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  ticketMore: { alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.surface },
  lineup: { gap: spacing.md, paddingVertical: spacing.xs },
  artist: { width: 76, alignItems: 'center', gap: spacing.sm },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.surface },
  artistName: { textAlign: 'center' },
  description: { lineHeight: 24 },
  related: { gap: spacing.md, paddingBottom: spacing.md },
  relatedTitle: { paddingHorizontal: spacing.md },
  relatedList: { gap: spacing.md, paddingHorizontal: spacing.md },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bookButton: { alignSelf: 'stretch' },
});
