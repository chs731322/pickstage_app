import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/app-tabs';
import { usePopularFestivals, type FestivalSummary } from '@/features/festivals';
import { useUnreadCount } from '@/features/notifications';
import { formatDateRange } from '@/lib/format';
import { festivalGenreLabel } from '@/lib/genreLabel';
import { colors, radius, spacing } from '@/theme';

const GAP = 14;
// 포스터 아래 정보(태그·제목·공연장·날짜·버튼)와 점, 아래 여백이 차지하는 높이 (화면 높이에서 포스터가 쓸 수 있는 크기를 계산할 때 쓴다)
const INFO_HEIGHT = 215;
const DOTS_HEIGHT = 30;
const HERO_BOTTOM = 24;

// 홈 맨 위 검정 영역: 로고·검색·알림, "PICK YOUR STAGE" 글자, 인기 공연 포스터를 옆으로 넘겨 보는 캐러셀 (웹 메인과 같은 구성)
export function HeroSection() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data } = usePopularFestivals(5);
  const { data: unreadCount } = useUnreadCount();
  const [index, setIndex] = useState(0);
  const [scrollX] = useState(() => new Animated.Value(0));

  // 홈을 열었을 때 버튼까지 한 화면에 보이도록, 남는 높이에 맞춰 포스터 크기를 정한다
  const letteringWidth = width * 0.46;
  const letteringHeight = (letteringWidth * 609) / 1004;
  const fixedHeights = insets.top + 54 + letteringHeight + 20 + INFO_HEIGHT + DOTS_HEIGHT + HERO_BOTTOM + TAB_BAR_HEIGHT + insets.bottom;
  const cardWidth = Math.round(Math.max(130, Math.min(width * 0.56, ((height - fixedHeights) * 3) / 4)));
  const snap = cardWidth + GAP;
  const sidePad = (width - cardWidth) / 2;
  const festivals = data ?? [];
  const current: FestivalSummary | undefined = festivals[index];

  return (
    <View style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}>
      {/* 로고와 검색·알림 */}
      <View style={styles.topBar}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <View style={styles.topIcons}>
          <Pressable onPress={() => router.push('/performances')} hitSlop={10} accessibilityLabel="공연 검색">
            <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.white} size={24} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/notifications')}
            hitSlop={10}
            accessibilityLabel={unreadCount ? `알림, 안 읽은 알림 ${unreadCount}개` : '알림'}>
            <SymbolView name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} tintColor={colors.white} size={24} />
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

      <Image
        source={require('../../assets/images/decor/pick-your-stage.webp')}
        style={[styles.lettering, { width: letteringWidth, height: letteringHeight }]}
        contentFit="contain"
      />

      {/* 포스터 캐러셀: 가운데 포스터가 크고 선명하고, 양옆은 작고 흐리게 */}
      <Animated.FlatList
        data={festivals}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snap}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: sidePad, gap: GAP }}
        style={styles.carousel}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / snap);
          setIndex(Math.max(0, Math.min(festivals.length - 1, next)));
        }}
        renderItem={({ item, index: i }) => {
          const range = [(i - 1) * snap, i * snap, (i + 1) * snap];
          const scale = scrollX.interpolate({ inputRange: range, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange: range, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
          return (
            <Animated.View style={{ width: cardWidth, transform: [{ scale }], opacity }}>
              <Pressable onPress={() => router.push(`/festival/${item.id}`)} accessibilityLabel={`${item.title} 상세 보기`}>
                {item.posterImage ? (
                  <Image
                    source={{ uri: item.posterImage }}
                    style={[styles.poster, { width: cardWidth, height: (cardWidth * 4) / 3 }]}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <View style={[styles.poster, styles.noPoster, { width: cardWidth, height: (cardWidth * 4) / 3 }]}>
                    <AppText color={colors.textMuted}>포스터 준비 중</AppText>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          );
        }}
      />

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
              <AppText weight="semibold" size={13} color={colors.heroMuted}>
                {current.region}
              </AppText>
            ) : null}
          </View>
          <AppText weight="extrabold" size={24} color={colors.white} numberOfLines={2} style={styles.centerText}>
            {current.title}
          </AppText>
          {current.venueName ? (
            <AppText weight="medium" size={15} color={colors.white} style={styles.centerText}>
              {current.venueName}
            </AppText>
          ) : null}
          <AppText size={14} color={colors.heroMuted}>
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
  hero: { backgroundColor: '#000000', paddingBottom: HERO_BOTTOM },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  logo: { width: 52, height: 38 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 17, height: 17, paddingHorizontal: 4, borderRadius: 9, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  topIcons: { flexDirection: 'row', alignItems: 'center', gap: 22 },
  lettering: { alignSelf: 'center', marginTop: spacing.sm },
  carousel: { flexGrow: 0, marginTop: spacing.sm },
  poster: {
    borderRadius: 18,
    backgroundColor: '#1c1c20',
  },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  info: { alignItems: 'center', gap: 6, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.brand },
  centerText: { textAlign: 'center' },
  cta: {
    marginTop: spacing.sm,
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555559' },
  dotActive: { width: 18, backgroundColor: colors.brand },
});
