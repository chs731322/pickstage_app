import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  // 제목 바로 옆에 붙는 작은 버튼 (예: 캘린더의 "오늘")
  action?: ReactNode;
  // 화면 내용의 좌우 여백. 하늘색 띠가 화면 끝까지 닿도록 이 값만큼 바깥으로 넓힌다
  bleed?: number;
  // 제목 아래에 놓는 것 (검색창 등)
  children?: ReactNode;
};

// 탭 화면 맨 위의 하늘색 제목 띠: 제목과 소개 글, 아래쪽 물결 (홈의 하늘색 물결과 같은 모양)
export function TabHero({ title, subtitle, action, bleed = spacing.md, children }: Props) {
  const { width } = useWindowDimensions();
  const waveHeight = Math.round((width * 200) / 1920) * 0.85;

  return (
    <View style={{ marginHorizontal: -bleed }}>
      <View style={[styles.band, { paddingHorizontal: bleed }]}>
        <View style={styles.titleRow}>
          <AppText weight="display" size={30}>
            {title}
          </AppText>
          {action}
        </View>
        {subtitle ? (
          <AppText weight="medium" size={14} color={colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
        {children}
      </View>
      <Image source={require('../../assets/images/decor/sky-wave-bottom.svg')} style={{ width, height: waveHeight, marginTop: -1, marginBottom: -spacing.sm }} contentFit="fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { gap: 8, paddingTop: spacing.lg, paddingBottom: spacing.xs, backgroundColor: colors.sky },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
