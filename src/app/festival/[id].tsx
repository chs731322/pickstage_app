import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { LineupSection } from '@/components/LineupSection';
import { CustomNotificationSheet } from '@/components/CustomNotificationSheet';
import { PosterCard } from '@/components/PosterCard';
import { useBookmarks, useToggleBookmark } from '@/features/bookmarks';
import { useFestival, useRelatedFestivals, type FestivalDetail } from '@/features/festivals';
import { useAuth } from '@/lib/auth';
import { daysUntil, festivalStatus, formatDateRange, formatOpenAt } from '@/lib/format';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { darkHeaderOptions } from '@/lib/darkHeader';
import { SITE_URL } from '@/lib/links';
import { useStatusBarStyle } from '@/lib/useStatusBarStyle';
import { colors, radius, spacing } from '@/theme';

const BOTTOM_BAR_HEIGHT = 72;

type Ticket = NonNullable<FestivalDetail['tickets']>[number];

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
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'ios' ? headerHeight : 0;

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !festival) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
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
  // 맨 위가 검정이라 상태바·뒤로가기 글자는 흰색
  useStatusBarStyle('light');
  const { width } = useWindowDimensions();
  const { isLoggedIn } = useAuth();
  const { data: bookmarks } = useBookmarks();
  const toggleBookmark = useToggleBookmark(festival.id);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const { data: related } = useRelatedFestivals(festival);

  const isBookmarked = Boolean(bookmarks?.some((b) => b.id === festival.id));
  // 목록 카드와 같은 기준 (종료 / 진행 중 / D-n)
  const status = festivalStatus(festival.startDate, festival.endDate);
  const isEnded = status?.kind === 'ended';
  const genre = festivalGenreLabel(festival.genre);
  const options = useMemo(() => bookingOptions(festival), [festival]);
  const action = bookAction(festival, options.length > 0, isEnded);
  const posterWidth = Math.min(width * 0.58, 280);
  const lineup = festival.artists ?? [];
  const tickets = festival.tickets ?? [];
  const venue = festival.venue;
  const directions =
    venue?.latitude && venue?.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
      : venue?.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`
        : null;

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

  const handleShare = () =>
    Share.share({
      message: `${festival.title} — PICKSTAGE에서 확인해보세요.\n${SITE_URL}/performances/${festival.id}`,
    });

  return (
    <View style={styles.flex}>
      <Stack.Screen options={darkHeaderOptions} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BOTTOM_BAR_HEIGHT + bottomInset + spacing.lg }}>
        {/* 맨 위: 검정 바탕에 포스터 */}
        <View style={[styles.hero, { paddingTop: topPadding + spacing.md }]}>
          {festival.posterImage ? (
            <Image
              source={{ uri: festival.posterImage }}
              style={[styles.poster, { width: posterWidth, height: (posterWidth * 4) / 3 }]}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.poster, styles.noPoster, { width: posterWidth, height: (posterWidth * 4) / 3 }]}>
              <AppText color={colors.textMuted}>포스터 준비 중</AppText>
            </View>
          )}
        </View>
        <Image
          source={require('../../../assets/images/decor/hero-wave.webp')}
          style={{ width, height: (width * 246) / 1948, marginTop: -1 }}
          contentFit="fill"
        />

        {/* 제목과 기본 정보 */}
        <View style={styles.titleBlock}>
          <View style={styles.tags}>
            {status ? (
              <View style={[styles.tag, isEnded && styles.tagEnded, status.kind === 'live' && styles.tagLive]}>
                <AppText weight="bold" size={13} color={colors.white}>
                  {status.label}
                </AppText>
              </View>
            ) : null}
            {genre ? (
              <View style={styles.tagOutline}>
                <AppText weight="semibold" size={13} color={colors.textSecondary}>
                  {genre}
                </AppText>
              </View>
            ) : null}
            {festival.region ? (
              <View style={styles.tagOutline}>
                <AppText weight="semibold" size={13} color={colors.textSecondary}>
                  {festival.region}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText weight="extrabold" size={27} style={styles.title}>
            {festival.title}
          </AppText>
          <InfoRow icon={{ ios: 'calendar', android: 'event', web: 'event' }} text={formatDateRange(festival.startDate, festival.endDate)} />
          {venue ? (
            <InfoRow
              icon={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
              text={venue.name}
              onPress={() => router.push(`/venue/${venue.id}`)}
            />
          ) : null}
          <View style={styles.actions}>
            <ActionButton
              label={isBookmarked ? '찜 취소' : '찜하기'}
              icon={isBookmarked ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
              active={isBookmarked}
              onPress={handleBookmark}
            />
            <ActionButton
              label="공유"
              icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              onPress={handleShare}
            />
            {!isEnded ? (
              <ActionButton label="알림" icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }} onPress={handleNotify} />
            ) : null}
            {festival.externalUrl ? (
              <ActionButton
                label="공식 사이트"
                icon={{ ios: 'safari', android: 'public', web: 'public' }}
                onPress={() => openLink(festival.externalUrl!)}
              />
            ) : null}
          </View>
          <AppText size={13} color={colors.textMuted}>
            찜 {festival.bookmarkCount} · 조회 {festival.viewCount}
          </AppText>
        </View>

        <View style={styles.sections}>
          {/* 예매 정보 */}
          {tickets.length > 0 || festival.ticketOpenAt ? (
            <Card title="예매 정보">
              {festival.ticketOpenAt ? (
                <AppText size={16} color={colors.textSecondary}>
                  티켓 오픈 <AppText weight="bold" size={16} color={colors.brand}>{formatOpenAt(festival.ticketOpenAt)}</AppText>
                </AppText>
              ) : null}
              {tickets.map((ticket, index) => (
                <TicketRow key={`${ticket.label}-${index}`} ticket={ticket} />
              ))}
            </Card>
          ) : null}

          {/* 라인업 */}
          {lineup.length > 0 ? (
            <Card title={`라인업 ${lineup.length}`}>
              <LineupSection artists={lineup} contentWidth={width - (spacing.md + 2) * 2 - spacing.md * 2} />
            </Card>
          ) : null}

          {/* 공연 소개 */}
          {festival.description ? (
            <Card title="공연 소개">
              <AppText size={16} color={colors.textSecondary} style={styles.description}>
                {festival.description}
              </AppText>
            </Card>
          ) : null}

          {/* 장소 */}
          {venue ? (
            <Card title="장소 정보">
              <AppText weight="bold" size={17}>{venue.name}</AppText>
              {venue.address ? (
                <AppText size={15} color={colors.textSecondary}>
                  {venue.address}
                </AppText>
              ) : null}
              <View style={styles.venueActions}>
                <Pressable onPress={() => router.push(`/venue/${venue.id}`)} hitSlop={6}>
                  <AppText weight="bold" size={15} color={colors.brand}>
                    공연장 정보 보기 ›
                  </AppText>
                </Pressable>
                {directions ? (
                  <Pressable onPress={() => Linking.openURL(directions)} hitSlop={6}>
                    <AppText weight="bold" size={15} color={colors.brand}>
                      길찾기 ›
                    </AppText>
                  </Pressable>
                ) : null}
              </View>
            </Card>
          ) : null}
        </View>

        {/* 함께 볼만한 공연 */}
        {related && related.length > 0 ? (
          <View style={styles.related}>
            <AppText weight="extrabold" size={22} style={styles.relatedTitle}>
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
      </ScrollView>

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

type SymbolName = { ios: string; android: string; web: string };

function InfoRow({ icon, text, onPress }: { icon: SymbolName; text: string; onPress?: () => void }) {
  const content = (
    <View style={styles.infoRow}>
      <SymbolView name={icon as never} tintColor={colors.textMuted} size={20} />
      <AppText size={17} color={onPress ? colors.text : colors.textSecondary} style={styles.infoText}>
        {text}
      </AppText>
      {onPress ? <AppText color={colors.textMuted}>›</AppText> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function ActionButton({
  label,
  icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: SymbolName;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <SymbolView name={icon as never} tintColor={active ? colors.brand : colors.text} size={24} />
      <AppText size={13} weight="medium" color={active ? colors.brand : colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <AppText weight="extrabold" size={21}>
        {title}
      </AppText>
      {children}
    </View>
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
      <AppText weight="extrabold" size={16}>
        {formatPrice(ticket.price)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.background },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  hero: { backgroundColor: '#000000', alignItems: 'center', paddingBottom: spacing.lg },
  poster: { borderRadius: 18, backgroundColor: '#1c1c20' },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  titleBlock: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.pageBg },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand },
  tagEnded: { backgroundColor: colors.textMuted },
  tagLive: { backgroundColor: colors.text },
  tagOutline: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  title: { lineHeight: 35 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { flexShrink: 1 },
  actions: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.sm },
  action: { alignItems: 'center', gap: 4, minWidth: 48 },
  sections: { gap: spacing.md, padding: spacing.md, paddingTop: 0, backgroundColor: colors.pageBg },
  card: {
    gap: spacing.md,
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  lineup: { gap: spacing.md, paddingVertical: 4 },
  artist: { width: 76, alignItems: 'center', gap: 6 },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.surface },
  artistName: { textAlign: 'center' },
  description: { lineHeight: 26 },
  venueActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs },
  related: { gap: spacing.md, paddingBottom: spacing.md, backgroundColor: colors.pageBg },
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
