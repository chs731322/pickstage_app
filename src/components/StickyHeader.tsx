import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

// 헤더의 높이 (위쪽 안전 영역 제외)
export const STICKY_HEADER_HEIGHT = 52;
// 이만큼 내리면 바탕과 제목이 다 나타난다
const FADE_DISTANCE = 56;

type Props = {
  title: string;
  // 화면의 세로 스크롤 위치
  scrollY: Animated.Value;
  // 오른쪽의 아이콘 버튼들
  right?: ReactNode;
  // 뒤로 가기 아이콘 색 (맨 위가 어두운 화면에서는 내리기 전까지 흰색)
  tint?: string;
};

// 위에 고정되는 헤더: 뒤로 가기와 오른쪽 아이콘은 항상 보이고,
// 내용을 내리면 바탕과 제목이 서서히 나타나서 아이콘이 내용에 묻히지 않는다.
export function StickyHeader({ title, scrollY, right, tint }: Props) {
  const insets = useSafeAreaInsets();
  const shown = scrollY.interpolate({ inputRange: [0, FADE_DISTANCE], outputRange: [0, 1], extrapolate: 'clamp' });
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <Animated.View style={[styles.background, { opacity: shown }]} />
      <View style={styles.row}>
        <HeaderIcon label="뒤로 가기" icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} onPress={goBack} color={tint} />
        <Animated.View style={[styles.title, { opacity: shown }]}>
          <AppText weight="bold" size={16} numberOfLines={1}>
            {title}
          </AppText>
        </Animated.View>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

export function HeaderIcon({
  label,
  icon,
  onPress,
  active = false,
  color = colors.text,
  activeColor = colors.brand,
}: {
  // 화면에는 아이콘만 보이고, 이름은 화면 읽기가 읽는다
  label: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
  active?: boolean;
  color?: string;
  activeColor?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.icon, pressed && styles.pressed]} hitSlop={4} accessibilityRole="button" accessibilityLabel={label}>
      <SymbolView name={icon as never} tintColor={active ? activeColor : color} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  background: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.pageBg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', height: STICKY_HEADER_HEIGHT, paddingHorizontal: spacing.sm },
  title: { flex: 1, paddingHorizontal: spacing.xs },
  right: { flexDirection: 'row', alignItems: 'center' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
});
