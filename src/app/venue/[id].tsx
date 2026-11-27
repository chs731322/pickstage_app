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

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PosterCard } from '@/components/PosterCard';
import { ReportBlockMenu } from '@/components/ReportBlockMenu';
import { ReviewHighlightCard } from '@/components/ReviewHighlightCard';
import { ReviewFormSheet } from '@/components/ReviewFormSheet';
import {
  parseFacilities,
  useCreateReview,
  useVenue,
  useVenueConcertDetails,
  type VenueDetail,
  type VenueReview,
} from '@/features/venues';
import { useAuth } from '@/lib/auth';
import { heroHeaderOptions } from '@/lib/heroHeader';
import { SITE_URL } from '@/lib/links';
import { cardShadow, colors, radius, spacing } from '@/theme';

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: venue, isPending, error, refetch } = useVenue(id);
  const headerHeight = useHeaderHeight();
  const topPadding = Platform.OS === 'ios' ? headerHeight : 0;

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !venue) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <AppText weight="bold" size={18}>
          공연장을 찾을 수 없어요
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

  return <VenueBody venue={venue} topPadding={topPadding} />;
}

function VenueBody({ venue, topPadding }: { venue: VenueDetail; topPadding: number }) {
  const { width } = useWindowDimensions();
  const { isLoggedIn } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);
  const createReview = useCreateReview(venue.id);
  // 이 화면에서 차단한 사용자의 후기는 바로 뺀다
  const [blockedIds, setBlockedIds] = useState<number[]>([]);
  const [page, setPage] = useState(0);

  const images = useMemo(() => (venue.images ?? []).filter((img) => img.imageUrl), [venue.images]);
  const credits = [...new Set(images.map((img) => img.credit).filter(Boolean))] as string[];
  const concerts = venue.upcomingConcerts ?? [];
  const concertDetails = useVenueConcertDetails(concerts.map((c) => c.id));
  const reviews = (venue.reviews ?? []).filter((r) => r.authorId == null || !blockedIds.includes(r.authorId));
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const directions =
    venue.latitude && venue.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
      : venue.address
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(venue.address)}`
        : null;
  const facilities = parseFacilities(venue.facilities);
  // 값만 봐도 알 수 있으면 라벨을 붙이지 않는다 (수용 인원은 "○명 수용"으로 한 줄에)
  const facts = [
    venue.capacity ? { key: 'capacity', label: null, value: `${venue.capacity.toLocaleString('ko-KR')}명 수용` } : null,
    venue.transportInfo ? { key: 'transport', label: '교통', value: venue.transportInfo } : null,
  ].filter((fact): fact is { key: string; label: string | null; value: string } => fact !== null);

  const handleWrite = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 공연장 후기를 쓸 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    setReviewOpen(true);
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={heroHeaderOptions} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 맨 위: 검정 바탕에 공연장 사진 (옆으로 넘겨 본다) */}
        <View style={[styles.hero, { paddingTop: topPadding + spacing.md }]}>
          {images.length > 0 ? (
            <>
              <FlatList
                data={images}
                keyExtractor={(img) => String(img.id)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
                renderItem={({ item }) => (
                  <View style={{ width, paddingHorizontal: spacing.md }}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={[styles.photo, { height: ((width - spacing.md * 2) * 10) / 16 }]}
                      contentFit="cover"
                      transition={150}
                    />
                  </View>
                )}
              />
              {images.length > 1 ? (
                <View style={styles.dots}>
                  {images.map((img, i) => (
                    <View key={img.id} style={[styles.dot, i === page && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
              {credits.length > 0 ? (
                <AppText size={12} color={colors.heroMuted} style={styles.credit}>
                  {credits.join(' / ')}
                </AppText>
              ) : null}
            </>
          ) : (
            <View style={[styles.photo, styles.noPhoto, { width: width - spacing.md * 2, height: ((width - spacing.md * 2) * 10) / 16 }]}>
              <AppText color={colors.textMuted}>사진 준비 중</AppText>
            </View>
          )}
        </View>

        <View style={styles.titleBlock}>
          {venue.region ? (
            <View style={styles.tag}>
              <AppText weight="semibold" size={13} color={colors.textSecondary}>
                {venue.region}
              </AppText>
            </View>
          ) : null}
          <AppText weight="bold" size={22} style={styles.name}>
            {venue.name}
          </AppText>
          {venue.address ? (
            <AppText size={16} color={colors.textSecondary}>
              {venue.address}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {directions ? (
              <ActionButton
                label="길찾기"
                icon={{ ios: 'location.fill', android: 'directions', web: 'directions' }}
                onPress={() => Linking.openURL(directions)}
              />
            ) : null}
            <ActionButton
              label="공유"
              icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
              onPress={() => Share.share({ message: `${venue.name} — PICKSTAGE에서 확인해보세요.\n${SITE_URL}/venues/${venue.id}` })}
            />
          </View>
        </View>

        <View style={styles.sections}>
          {facts.length > 0 || venue.facilities ? (
            <View style={styles.card}>
              <AppText weight="bold" size={18}>
                공연장 정보
              </AppText>
              {facts.map((fact) => (
                <View key={fact.key} style={styles.fact}>
                  {fact.label ? (
                    <AppText weight="medium" size={13} color={colors.textMuted}>
                      {fact.label}
                    </AppText>
                  ) : null}
                  <AppText size={16} style={styles.factValue}>
                    {fact.value}
                  </AppText>
                </View>
              ))}
              {facilities ? (
                <>
                  {facilities.phone ? (
                    <View style={styles.fact}>
                      <Pressable onPress={() => Linking.openURL(`tel:${facilities.phone}`)} hitSlop={6}>
                        <AppText size={16} color={colors.brand} weight="semibold">
                          {facilities.phone}
                        </AppText>
                      </Pressable>
                    </View>
                  ) : null}
                  {facilities.homepage ? (
                    <View style={styles.fact}>
                      <Pressable onPress={() => WebBrowser.openBrowserAsync(facilities.homepage!)} hitSlop={6}>
                        <AppText size={16} color={colors.brand} weight="semibold">
                          공연장 홈페이지 열기 ›
                        </AppText>
                      </Pressable>
                    </View>
                  ) : null}
                  {facilities.available.length > 0 ? (
                    <View style={styles.fact}>
                      <AppText weight="medium" size={13} color={colors.textMuted}>
                        편의시설
                      </AppText>
                      <View style={styles.pills}>
                        {facilities.available.map((label) => (
                          <View key={label} style={styles.pill}>
                            <AppText weight="semibold" size={14} color={colors.textSecondary}>
                              {label}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </>
              ) : venue.facilities ? (
                <View style={styles.fact}>
                  <AppText weight="medium" size={13} color={colors.textMuted}>
                    편의시설
                  </AppText>
                  <AppText size={16} style={styles.factValue}>
                    {venue.facilities}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* 후기 하이라이트 (AI 요약) */}
          <ReviewHighlightCard target="venue" id={venue.id} />

          {/* 후기 */}
          <View style={styles.card}>
            <View style={styles.reviewHead}>
              <View style={styles.flex}>
                <AppText weight="bold" size={18}>
                  공연장 후기 {reviews.length}
                </AppText>
                {average !== null ? (
                  <View style={styles.average}>
                    <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={colors.star} size={16} />
                    <AppText weight="bold" size={14}>
                      {average.toFixed(1)}
                    </AppText>
                  </View>
                ) : null}
              </View>
              <Pressable onPress={handleWrite} style={({ pressed }) => [styles.writeButton, pressed && styles.writePressed]} accessibilityRole="button">
                <AppText weight="bold" size={14} color={colors.white}>
                  후기 작성
                </AppText>
              </Pressable>
            </View>
            {reviews.length === 0 ? (
              <AppText size={14} color={colors.textMuted}>
                아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.
              </AppText>
            ) : (
              reviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onBlocked={(userId) => setBlockedIds((prev) => [...prev, userId])}
                />
              ))
            )}
          </View>
        </View>

        {/* 이 공연장에서 하는 공연 */}
        {concerts.length > 0 ? (
          <View style={styles.concerts}>
            <AppText weight="bold" size={18} style={styles.concertsTitle}>
              이 공연장에서 하는 공연
            </AppText>
            <FlatList
              data={concerts}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.concertsList}
              renderItem={({ item, index }) => {
                const detail = concertDetails[index]?.data;
                return (
                  <PosterCard
                    festival={{
                      id: item.id,
                      title: item.title,
                      posterImage: detail?.posterImage ?? null,
                      startDate: item.startDate,
                      endDate: detail?.endDate ?? null,
                    }}
                  />
                );
              }}
            />
          </View>
        ) : null}
      </ScrollView>

      <ReviewFormSheet
        title={`${venue.name} 후기`}
        visible={reviewOpen}
        onClose={() => setReviewOpen(false)}
        successMessage="후기가 작성되었어요"
        onSubmit={(values) => createReview.mutateAsync({ venueId: venue.id, ...values })}
      />
    </View>
  );
}

function ReviewItem({ review, onBlocked }: { review: VenueReview; onBlocked: (userId: number) => void }) {
  const extra = [review.seatSection, review.viewInfo, review.standingTip].filter(Boolean).join(' · ');
  return (
    <View style={styles.review}>
      <View style={styles.reviewTop}>
        <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor={colors.star} size={15} />
        <AppText weight="bold" size={14}>
          {review.rating.toFixed(1)}
        </AppText>
        <Pressable disabled={review.authorId == null} onPress={() => router.push(`/user/${review.authorId}`)} style={styles.flex} hitSlop={4}>
          <AppText weight="semibold" size={14} numberOfLines={1}>
            {review.nickname}
          </AppText>
        </Pressable>
        <AppText size={13} color={colors.textMuted}>
          {review.createdAt ? review.createdAt.slice(0, 10).replaceAll('-', '.') : ''}
        </AppText>
        <ReportBlockMenu
          targetType="VENUE_REVIEW"
          targetId={review.id}
          authorId={review.authorId}
          authorName={review.nickname}
          onBlocked={onBlocked}
        />
      </View>
      <AppText size={16} style={styles.reviewContent}>
        {review.content}
      </AppText>
      {review.images && review.images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewPhotos}>
          {review.images.map((uri) => (
            <Pressable key={uri} onPress={() => WebBrowser.openBrowserAsync(uri)}>
              <Image source={{ uri }} style={styles.reviewPhoto} contentFit="cover" />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {extra ? (
        <AppText size={14} color={colors.textMuted}>
          {extra}
        </AppText>
      ) : null}
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.action} accessibilityRole="button">
      <SymbolView name={icon as never} tintColor={colors.textSecondary} size={22} />
      <AppText size={13} weight="medium" color={colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.background },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  hero: { backgroundColor: colors.pageBg, paddingBottom: spacing.lg },
  photo: { borderRadius: radius.lg, backgroundColor: colors.surface, ...cardShadow },
  noPhoto: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white },
  dotActive: { width: 18, backgroundColor: colors.brand },
  credit: { textAlign: 'center', marginTop: spacing.sm, paddingHorizontal: spacing.md },
  titleBlock: { gap: spacing.sm, padding: spacing.md, backgroundColor: colors.pageBg },
  tag: { alignSelf: 'flex-start', paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  name: { lineHeight: 30 },
  actions: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.sm },
  action: { alignItems: 'center', gap: spacing.xs, minWidth: 48 },
  sections: { gap: spacing.md, padding: spacing.md, paddingTop: 0 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  fact: { gap: spacing.xs },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  pill: { paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  factValue: { lineHeight: 24 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  average: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  writePressed: { backgroundColor: colors.brandStrong },
  writeButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.ms, borderRadius: radius.pill, backgroundColor: colors.brand },
  review: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewContent: { lineHeight: 24 },
  reviewPhotos: { gap: spacing.sm },
  reviewPhoto: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.surface },
  concerts: { gap: spacing.md, marginTop: spacing.sm },
  concertsTitle: { paddingHorizontal: spacing.md },
  concertsList: { gap: spacing.md, paddingHorizontal: spacing.md },
});
