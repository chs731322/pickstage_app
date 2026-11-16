import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  // 제목 앞에 붙는 작은 장식 그림 (예: 핑크 폭죽)
  icon?: ImageSource | number;
  // 오른쪽 "전체보기 ›"
  onPressMore?: () => void;
};

// 섹션 맨 위의 큼직한 제목 줄 (제목 왼쪽, 전체보기 오른쪽)
export function SectionHeader({ title, icon, onPressMore }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        {icon ? <Image source={icon} style={styles.icon} contentFit="contain" /> : null}
        <AppText weight="extrabold" size={22}>
          {title}
        </AppText>
      </View>
      {onPressMore ? (
        <Pressable onPress={onPressMore} hitSlop={10} accessibilityRole="link">
          <AppText weight="medium" size={14} color={colors.textMuted}>
            전체보기 ›
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 30, height: 30 },
});
