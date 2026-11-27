import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Highlight } from '@/components/Highlight';
import { TAB_BAR_HEIGHT } from '@/components/app-tabs';
import { usePopularFestivals, type FestivalSummary } from '@/features/festivals';
import { useUnreadCount } from '@/features/notifications';
import { formatDateRange } from '@/lib/format';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { cardShadow, colors, radius, spacing } from '@/theme';

const GAP = 12;
// 자동으로 다음 포스터로 넘어가는 간격(밀리초)
const AUTO_MS = 4000;
// 포스터 아래 정보(태그·제목·공연장·날짜·버튼)와 아래 여백이 차지하는 높이 (화면 높이에서 포스터가 쓸 수 있는 크기를 계산할 때 쓴다)
const INFO_HEIGHT = 200;
// 배너 위의 "이번 달 주목할 만한 공연" 문구와 그 아래 간격
const HEADLINE_HEIGHT = 40;
const HERO_BOTTOM = 32;

// 홈 맨 위 밝은 영역: 로고·검색·알림, 인기 공연 포스터를 한 줄로 늘어놓은 배너.
// 지금 포스터는 가운데에 크게, 양옆 포스터는 살짝 보이고, 옆으로 밀거나 4초마다 자동으로 넘어간다 (예스24 앱 메인 배너와 같은 방식).
export function HeroSection() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data } = usePopularFestivals(5);
  const { data: unreadCount } = useUnreadCount();
  const [index, setIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));
  const listRef = useRef<FlatList<FestivalSummary>>(null);
  const touchedAt = useRef(0);
  const focused = useRef(true);

  // 홈을 열었을 때 버튼까지 한 화면에 보이도록, 남는 높이에 맞춰 포스터 크기를 정한다
  const fixedHeights = insets.top + 54 + HEADLINE_HEIGHT + 32 + INFO_HEIGHT + HERO_BOTTOM + TAB_BAR_HEIGHT + insets.bottom;
  const cardWidth = Math.round(Math.max(130, Math.min(width * 0.62, ((height - fixedHeights) * 3) / 4)));
  const cardHeight = (cardWidth * 4) / 3;
  const snap = cardWidth + GAP;
  // 지금 포스터가 화면 가운데에 오고, 양옆 포스터가 살짝 보인다
  const sidePad = (width - cardWidth) / 2;
  const festivals = data ?? [];
  const count = festivals.length;
  const current: FestivalSummary | undefined = festivals[index];

  // 이 탭을 보고 있는 동안만 자동으로 넘긴다. 손으로 넘긴 직후에는 잠시 기다렸다가 이어간다.
  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      return () => {
        focused.current = false;
      };
    }, []),
  );
  useEffect(() => {
    const timer = setInterval(() => {
      if (!focused.current || count < 2) return;
      if (Date.now() - touchedAt.current < AUTO_MS - 500) return;
      const next = (index + 1) % count;
      listRef.current?.scrollToOffset({ offset: next * snap, animated: true });
      setIndex(next);
    }, AUTO_MS);
    // 포스터가 바뀔 때마다 타이머를 새로 시작해서, 손으로 넘긴 뒤에도 4초는 가만히 보여준다
    return () => clearInterval(timer);
  }, [count, snap, index]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
      {/* 로고와 검색·알림 */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <View style={styles.topIcons}>
          <Pressable onPress={() => router.push('/performances')} hitSlop={10} accessibilityLabel="공연 검색">
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              tintColor={colors.text}
              size={24}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            accessibilityLabel={unreadCount ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}>
            <SymbolView
              name={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
              tintColor={colors.text}
              size={24}
            />
            {unreadCount ? (
              <View style={styles.badge}>
                <AppText weight="bold" size={12} color={colors.white}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* 배너 위 문구 */}
      <View style={styles.headline}>
        <AppText weight="display" size={18} style={styles.centerText}>
          이번 달 <Highlight>주목할 만한</Highlight> 공연
        </AppText>
      </View>

      {/* 배너: 포스터 뒤의 은은한 분홍 번짐 */}
      <Image
        source={require('../../assets/images/decor/hero-glow.webp')}
        style={[styles.glow, { width: width * 1.9, height: cardHeight * 1.5, left: -width * 0.45 }]}
        contentFit="fill"
        pointerEvents="none"
      />
      <View style={styles.banner}>
        <Animated.FlatList
          ref={listRef}
          data={festivals}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={snap}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}
          style={styles.carousel}
          onScrollBeginDrag={() => {
            touchedAt.current = Date.now();
          }}
          // 스크롤이 멈춘 자리를 기준으로 몇 번째인지 확정한다 (움직이는 중의 값은 마지막 위치를 놓칠 수 있다)
          onMomentumScrollEnd={(event) => {
            setIndex(Math.max(0, Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.x / snap))));
          }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: true,
            listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
              const next = Math.max(0, Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.x / snap)));
              setIndex(next);
            },
          })}
          scrollEventThrottle={16}
          renderItem={({ item, index: i }) => {
            const range = [(i - 1) * snap, i * snap, (i + 1) * snap];
            // 지금 포스터가 아니면 살짝 어둡게
            const dim = scrollX.interpolate({ inputRange: range, outputRange: [0.4, 0, 0.4], extrapolate: 'clamp' });
            return (
              <Pressable
                onPress={() => router.push(`/festival/${item.id}`)}
                accessibilityLabel={`${item.title} 상세 보기`}
                style={[styles.poster, cardShadow, { width: cardWidth, height: cardHeight }]}>
                {item.posterImage ? (
                  <Image
                    source={{ uri: item.posterImage }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.noPoster]}>
                    <AppText color={colors.textMuted}>포스터 준비 중</AppText>
                  </View>
                )}
                <Animated.View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: dim }]}
                />
              </Pressable>
            );
          }}
        />

        {/* 몇 번째 포스터인지: 지금 포스터의 오른쪽 아래 */}
        {count > 1 ? (
          <View pointerEvents="none" style={[styles.counterWrap, { left: sidePad, width: cardWidth }]}>
            <View style={styles.counter}>
              <AppText weight="bold" size={12} color={colors.white}>
                {index + 1} / {count}
              </AppText>
            </View>
          </View>
        ) : null}
      </View>

      {/* 지금 포스터의 정보 */}
      {current ? (
        <View style={styles.info}>
          <View style={styles.tags}>
            {festivalGenreLabel(current.genre) ? (
              <View style={styles.tag}>
                <AppText weight="bold" size={12} color={colors.white}>
                  {festivalGenreLabel(current.genre)}
                </AppText>
              </View>
            ) : null}
            {current.region ? (
              <AppText weight="semibold" size={13} color={colors.textMuted}>
                {current.region}
              </AppText>
            ) : null}
          </View>
          <AppText weight="display" size={22} color={colors.text} numberOfLines={2} style={styles.centerText}>
            {current.title}
          </AppText>
          {current.venueName ? (
            <AppText weight="medium" size={14} color={colors.textSecondary} style={styles.centerText}>
              {current.venueName}
            </AppText>
          ) : null}
          <AppText size={14} color={colors.textMuted}>
            {formatDateRange(current.startDate, current.endDate)}
          </AppText>
          <Pressable style={styles.cta} onPress={() => router.push(`/festival/${current.id}`)}>
            <AppText weight="bold" size={14} color={colors.white}>
              공연 보러가기
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: HERO_BOTTOM, overflow: 'hidden' },
  glow: { position: 'absolute', top: 90 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  logo: { width: 52, height: 38 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 17,
    height: 17,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headline: { alignItems: 'center', marginTop: spacing.lg },
  banner: { marginTop: spacing.md },
  carousel: { flexGrow: 0, paddingVertical: spacing.sm },
  poster: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  counterWrap: { position: 'absolute', bottom: 18, alignItems: 'flex-end', paddingRight: spacing.ms },
  counter: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: 'rgba(0,0,0,0.55)' },
  info: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  centerText: { textAlign: 'center' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.ms, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.brand },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: 30,
    paddingVertical: spacing.ms,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
});
