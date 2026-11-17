import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/app-tabs';
import { usePopularFestivals, type FestivalSummary } from '@/features/festivals';
import { useUnreadCount } from '@/features/notifications';
import { formatDateRange } from '@/lib/format';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { cardShadow, colors, radius, spacing } from '@/theme';

// 부채꼴: 포스터 한 장마다 몇 도씩 벌어지는지, 자동으로 넘어가는 간격(밀리초)
const FAN_DEG = 11;
const AUTO_MS = 4000;
// 포스터 아래로 이만큼(포스터 높이 비율) 떨어진 점을 중심으로 부채처럼 펼쳐진다
const FAN_PIVOT = '50% 118%';
// 부채가 펼쳐지면서 위아래로 더 차지하는 높이
const FAN_EXTRA = 36;
// 포스터 아래 정보(태그·제목·공연장·날짜·버튼)와 점, 아래 여백이 차지하는 높이 (화면 높이에서 포스터가 쓸 수 있는 크기를 계산할 때 쓴다)
const INFO_HEIGHT = 215;
const DOTS_HEIGHT = 30;
const HERO_BOTTOM = 24;

// 홈 맨 위 밝은 영역: 로고·검색·알림, 인기 공연 포스터를 옆으로 넘겨 보는 캐러셀. 오른쪽 위에 분홍빛이 은은하게 번진다
export function HeroSection() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data } = usePopularFestivals(5);
  const { data: unreadCount } = useUnreadCount();
  const [index, setIndex] = useState(0);
  const [pos] = useState(() => new Animated.Value(0));
  const indexRef = useRef(0);
  const touchedAt = useRef(0);
  const dragging = useRef(false);
  const focused = useRef(true);

  // 홈을 열었을 때 버튼까지 한 화면에 보이도록, 남는 높이에 맞춰 포스터 크기를 정한다
  const fixedHeights = insets.top + 54 + 24 + INFO_HEIGHT + DOTS_HEIGHT + HERO_BOTTOM + TAB_BAR_HEIGHT + insets.bottom;
  const cardWidth = Math.round(Math.max(130, Math.min(width * 0.56, ((height - fixedHeights - FAN_EXTRA) * 3) / 4)));
  const cardHeight = (cardWidth * 4) / 3;
  const dragStep = cardWidth * 0.5;
  const festivals = data ?? [];
  const current: FestivalSummary | undefined = festivals[index];

  // index번째 포스터가 맨 앞으로 오게 한다
  const goTo = useCallback(
    (target: number) => {
      indexRef.current = target;
      setIndex(target);
      touchedAt.current = Date.now();
      Animated.spring(pos, {
        toValue: target,
        friction: 9,
        tension: 55,
        useNativeDriver: true,
      }).start();
    },
    [pos],
  );

  // 손가락으로 좌우로 밀어서 넘기기 (살짝 누르는 건 포스터를 누르는 걸로 둔다)
  const count = festivals.length;
  // 제스처 핸들러가 손을 움직이는 동안(화면을 그릴 때가 아니라) ref를 읽고 쓰는 것이라 안전하다
  const panResponder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dragging.current = true;
          pos.stopAnimation();
        },
        onPanResponderMove: (_, g) => {
          const next = indexRef.current - g.dx / dragStep;
          pos.setValue(Math.max(0, Math.min(count - 1, next)));
        },
        onPanResponderRelease: (_, g) => {
          dragging.current = false;
          const target = Math.round(indexRef.current - (g.dx + g.vx * 80) / dragStep);
          goTo(Math.max(0, Math.min(count - 1, target)));
        },
        onPanResponderTerminate: () => {
          dragging.current = false;
          goTo(indexRef.current);
        },
      }),
    [count, dragStep, goTo, pos],
  );

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
      if (!focused.current || dragging.current || count < 2) return;
      if (Date.now() - touchedAt.current < AUTO_MS - 500) return;
      goTo((indexRef.current + 1) % count);
    }, AUTO_MS);
    return () => clearInterval(timer);
  }, [goTo, count]);

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
      {/* 로고와 검색·알림 */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <View style={styles.topIcons}>
          <Pressable onPress={() => router.push('/performances')} hitSlop={10} accessibilityLabel="공연 검색">
            <SymbolView
              name={{
                ios: 'magnifyingglass',
                android: 'search',
                web: 'search',
              }}
              tintColor={colors.text}
              size={24}
            />
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            accessibilityLabel={unreadCount ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}>
            <SymbolView
              name={{
                ios: 'bell',
                android: 'notifications',
                web: 'notifications',
              }}
              tintColor={colors.text}
              size={24}
            />
            {unreadCount ? (
              <View style={styles.badge}>
                <AppText weight="bold" size={10} color={colors.white}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>

      {/* 포스터 부채: 가운데 포스터가 맨 앞이고, 나머지는 뒤에서 부채처럼 펼쳐진다. 좌우로 밀면 넘어간다 */}
      <View style={[styles.fan, { height: cardHeight + FAN_EXTRA }]} {...panResponder.panHandlers}>
        {/* 포스터 뒤의 은은한 분홍 번짐 */}
        <Image
          source={require('../../assets/images/decor/hero-glow.webp')}
          style={{
            position: 'absolute',
            left: -width * 0.25,
            top: -cardHeight * 0.12,
            width: width * 1.5,
            height: cardHeight * 1.2,
          }}
          contentFit="fill"
          pointerEvents="none"
        />
        {festivals.map((item, i) => {
          const at = (values: number[] | string[]) =>
            pos.interpolate({
              inputRange: [i - 3, i - 2, i - 1, i, i + 1, i + 2, i + 3],
              outputRange: values as number[],
              extrapolate: 'clamp',
            });
          const rotate = at([
            FAN_DEG * 3 + 'deg',
            FAN_DEG * 2 + 'deg',
            FAN_DEG + 'deg',
            '0deg',
            -FAN_DEG + 'deg',
            -FAN_DEG * 2 + 'deg',
            -FAN_DEG * 3 + 'deg',
          ] as never);
          const dim = at([0.55, 0.45, 0.28, 0, 0.28, 0.45, 0.55]);
          const opacity = at([0, 1, 1, 1, 1, 1, 0]);
          return (
            <Animated.View
              key={item.id}
              style={[
                styles.fanCard,
                cardShadow,
                {
                  width: cardWidth,
                  height: cardHeight,
                  left: (width - cardWidth) / 2,
                  zIndex: festivals.length - Math.abs(i - index),
                  opacity,
                  transform: [{ rotate }],
                  transformOrigin: FAN_PIVOT,
                },
              ]}>
              <Pressable
                onPress={() => (i === index ? router.push(`/festival/${item.id}`) : goTo(i))}
                accessibilityLabel={`${item.title} 상세 보기`}
                style={styles.poster}>
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
                {/* 뒤로 갈수록 어둡게 */}
                <Animated.View
                  pointerEvents="none"
                  style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: dim }]}
                />
              </Pressable>
            </Animated.View>
          );
        })}
        <Image
          source={require('../../assets/images/decor/bolt-pink.svg')}
          style={styles.bolt}
          contentFit="contain"
          pointerEvents="none"
        />
      </View>

      {/* 가운데 포스터의 정보 */}
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
          <AppText weight="extrabold" size={24} color={colors.text} numberOfLines={2} style={styles.centerText}>
            {current.title}
          </AppText>
          {current.venueName ? (
            <AppText weight="medium" size={15} color={colors.textSecondary} style={styles.centerText}>
              {current.venueName}
            </AppText>
          ) : null}
          <AppText size={14} color={colors.textMuted}>
            {formatDateRange(current.startDate, current.endDate)}
          </AppText>
          <Pressable style={styles.cta} onPress={() => router.push(`/festival/${current.id}`)}>
            <AppText weight="bold" size={15} color={colors.white}>
              공연 보러가기
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {/* 현재 위치 점 */}
      {festivals.length > 1 ? (
        <View style={styles.dots}>
          {festivals.map((f, i) => (
            <View key={f.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingBottom: HERO_BOTTOM, overflow: 'hidden' },
  fan: { marginTop: spacing.sm },
  fanCard: { position: 'absolute', top: 6 },
  bolt: {
    position: 'absolute',
    right: spacing.md,
    bottom: 4,
    width: 44,
    height: 70,
  },
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
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  poster: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  info: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  centerText: { textAlign: 'center' },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 18, backgroundColor: colors.brand },
});
