import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { fetchFestivals } from '@/features/festivals';
import { colors, stickerColors } from '@/theme';

// 시안의 기준 크기 (이 비율대로 화면 폭에 맞춰 늘리고 줄인다)
const BASE_WIDTH = 390;
const FULL_HEIGHT = 344;
// 입력할 것이 많은 화면(회원가입·비밀번호 찾기)은 낮게
const COMPACT_HEIGHT = 216;

type Props = {
  width: number;
  // 라벨에 한 줄씩 들어가는 제목 (두 줄)
  title: [string, string];
  // 낮은 모양: 포스터와 메모 없이 로고·스티커만
  compact?: boolean;
};

// 로그인·회원가입·비밀번호 찾기 화면 위쪽의 스티커 콜라주: 가운데 로고와 라벨 제목, 가장자리의 스티커.
// 로그인(full)에는 공연 포스터와 메모가 더 붙는다.
// 열릴 때 조각들이 위에서 톡 떨어지고, 그 뒤에는 살짝 둥실거린다 ("동작 줄이기"를 켠 폰에서는 멈춰 있다).
export function AuthCollage({ width, title, compact = false }: Props) {
  const scale = Math.min(width / BASE_WIDTH, 1.15);
  // 곧 열리는 인기 공연의 포스터 두 장 (못 불러오면 포스터 없이 보여준다)
  const { data } = useQuery({
    queryKey: ['festivals', 'login-collage'],
    staleTime: 30 * 60_000,
    queryFn: () => fetchFestivals({ sort: 'popular', upcomingOnly: true, size: 6 }),
    enabled: !compact,
  });
  const posters = (compact ? [] : (data ?? [])).map((f) => f.posterImage).filter((url): url is string => Boolean(url)).slice(0, 2);
  const { drop, bob } = useCollageMotion();

  // 조각 하나: 자리(x, y)·폭·기울기. order 는 떨어지는 순서, sway 는 둥실거리는 폭
  const piece = (x: number, y: number, w: number, tilt: number, order: number, sway: number): StyleProp<ViewStyle> =>
    [
      styles.piece,
      {
        left: x * scale,
        top: y * scale,
        width: w * scale,
        opacity: drop[order],
        transform: [
          { translateY: drop[order].interpolate({ inputRange: [0, 1], outputRange: [-48, 0] }) },
          { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, sway] }) },
          { rotate: `${tilt}deg` },
        ],
      },
    ] as unknown as StyleProp<ViewStyle>;

  const sticker = (source: number, ratio: number, w: number) => (
    <Image source={source} style={{ width: w * scale, height: w * ratio * scale }} contentFit="contain" />
  );

  const guitar = require('../../assets/images/stickers/guitar.svg');
  const cassette = require('../../assets/images/stickers/cassette.svg');
  const heart = require('../../assets/images/stickers/heart.svg');
  const logo = compact ? { left: 143, top: 40, width: 104, height: 69 } : { left: 119, top: 110, width: 152, height: 101 };

  return (
    <View style={{ width: BASE_WIDTH * scale, height: (compact ? COMPACT_HEIGHT : FULL_HEIGHT) * scale, alignSelf: 'center' }}>
      <Image
        source={require('../../assets/images/stickers/glow.png')}
        style={[styles.piece, { left: 45 * scale, top: (compact ? 4 : 40) * scale, width: 300 * scale, height: (compact ? 210 : 260) * scale }]}
      />

      {compact ? (
        <>
          <Animated.View style={piece(36, 102, 50, -18, 2, -5)}>{sticker(guitar, 1.37, 50)}</Animated.View>
          <Animated.View style={piece(288, 62, 74, 10, 3, 5)}>{sticker(cassette, 0.78, 74)}</Animated.View>
          <Animated.View style={piece(64, 46, 36, -10, 5, 6)}>{sticker(heart, 1.05, 36)}</Animated.View>
          <Sparkle x={106 * scale} y={30 * scale} size={16} color={colors.brand} />
          <Sparkle x={316 * scale} y={146 * scale} size={14} color={stickerColors.navy} />
          <Sparkle x={26 * scale} y={186 * scale} size={16} color={stickerColors.pink} />
        </>
      ) : (
        <>
          {posters[0] ? (
            <Animated.View style={piece(-18, 84, 96, -9, 0, 4)}>
              <Polaroid uri={posters[0]} width={96 * scale} />
            </Animated.View>
          ) : null}
          {posters[1] ? (
            <Animated.View style={piece(300, 98, 98, 8, 1, -4)}>
              <Polaroid uri={posters[1]} width={98 * scale} />
            </Animated.View>
          ) : null}
          <Animated.View style={piece(288, 262, 112, -6, 4, 3)}>
            <View style={[styles.memo, { padding: 10 * scale }]}>
              <AppText allowFontScaling={false} weight="bold" size={13}>
                {'이번 주말\n어디 갈까?'}
              </AppText>
            </View>
          </Animated.View>
          <Animated.View style={piece(18, 206, 62, -18, 2, -6)}>{sticker(guitar, 1.37, 62)}</Animated.View>
          <Animated.View style={piece(244, 62, 76, 10, 3, 5)}>{sticker(cassette, 0.78, 76)}</Animated.View>
          <Animated.View style={piece(60, 78, 42, -10, 5, 6)}>{sticker(heart, 1.05, 42)}</Animated.View>
          <Sparkle x={112 * scale} y={100 * scale} size={18} color={colors.brand} />
          <Sparkle x={270 * scale} y={214 * scale} size={14} color={stickerColors.navy} />
          <Sparkle x={26 * scale} y={316 * scale} size={18} color={stickerColors.pink} />
        </>
      )}

      <Image
        source={require('../../assets/images/logo.png')}
        style={[styles.piece, { left: logo.left * scale, top: logo.top * scale, width: logo.width * scale, height: logo.height * scale }]}
        contentFit="contain"
        accessibilityLabel="PICKSTAGE"
      />
      <View style={[styles.title, { top: (compact ? 120 : 232) * scale }]} accessibilityRole="header" accessible accessibilityLabel={title.join(' ')}>
        {title.map((line, i) => (
          <View key={line} style={[styles.label, { transform: [{ rotate: i === 0 ? '-2deg' : '1.5deg' }], marginTop: i === 0 ? 0 : -1 }]}>
            <AppText allowFontScaling={false} weight="bold" size={22}>
              {line}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

// 사진처럼 흰 테두리를 두른 포스터
function Polaroid({ uri, width }: { uri: string; width: number }) {
  return (
    <View style={styles.polaroid}>
      <Image source={{ uri }} style={{ width: width - 10, height: (width - 10) * 1.32, borderRadius: 8 }} contentFit="cover" transition={150} />
    </View>
  );
}

// 네 갈래 반짝이 (글자 하나로 그린다)
function Sparkle({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <AppText allowFontScaling={false} color={color} style={{ position: 'absolute', left: x, top: y, fontSize: size + 4 }} accessibilityElementsHidden importantForAccessibility="no">
      ✦
    </AppText>
  );
}

function useCollageMotion() {
  const [drop] = useState(() => Array.from({ length: 6 }, () => new Animated.Value(0)));
  const [bob] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    let cancelled = false;
    const native = Platform.OS !== 'web';
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        drop.forEach((v) => v.setValue(1));
        return;
      }
      Animated.stagger(90, drop.map((v) => Animated.spring(v, { toValue: 1, friction: 6, tension: 60, useNativeDriver: native }))).start();
      const half = { duration: 2400, easing: Easing.inOut(Easing.quad), useNativeDriver: native };
      loop = Animated.loop(Animated.sequence([Animated.timing(bob, { toValue: 1, ...half }), Animated.timing(bob, { toValue: 0, ...half })]));
      loop.start();
    });
    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [drop, bob]);

  return { drop, bob };
}

const shadow = { shadowColor: colors.shadowInk, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 4 } as const;

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
  polaroid: { padding: 5, borderRadius: 12, backgroundColor: colors.white, ...shadow },
  memo: { backgroundColor: stickerColors.lime, ...shadow },
  title: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  label: { paddingHorizontal: 10, paddingVertical: 2, backgroundColor: colors.white, ...shadow, shadowOpacity: 0.08, elevation: 2 },
});
