import { Image, type ImageSource } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  // 제목 줄 오른쪽 끝을 장식하는 그림 (핑크 별·스피커 등)
  decor: ImageSource | number;
  decorWidth?: number;
  // 그림의 세로/가로 비율
  decorAspect?: number;
  // 제목 바로 옆에 붙는 작은 버튼 (예: 캘린더의 "오늘")
  action?: ReactNode;
  // 화면 내용의 좌우 여백. 하늘색 띠가 화면 끝까지 닿도록 이 값만큼 바깥으로 넓힌다
  bleed?: number;
  // 제목 아래에 놓는 것 (검색창 등)
  children?: ReactNode;
};

// 탭 화면 맨 위의 하늘색 제목 띠: 제목과 소개 글, 오른쪽의 장식 그림, 아래쪽 물결 (홈의 하늘색 물결과 같은 모양)
export function TabHero({ title, subtitle, decor, decorWidth = 96, decorAspect = 1, action, bleed = spacing.md, children }: Props) {
  const { width } = useWindowDimensions();
  const waveHeight = Math.round((width * 200) / 1920) * 1.5;

  return (
    <View style={{ marginHorizontal: -bleed }}>
      <View style={[styles.band, { paddingHorizontal: bleed }]}>
        <Image
          source={decor}
          style={{ position: 'absolute', right: bleed - 4, top: 14, width: decorWidth, height: decorWidth * decorAspect }}
          contentFit="contain"
          pointerEvents="none"
        />
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
      <Image source={require('../../assets/images/decor/sky-wave-bottom.svg')} style={{ width, height: waveHeight, marginTop: -1, marginBottom: spacing.xs }} contentFit="fill" />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { gap: 8, paddingTop: spacing.lg, paddingBottom: spacing.sm, backgroundColor: colors.sky },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
