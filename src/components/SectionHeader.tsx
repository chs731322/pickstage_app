import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Highlight } from '@/components/Highlight';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  // 제목 위에 작게 붙는 영문 라벨 (예: THIS WEEK)
  eyebrow?: string;
  // 제목 속에서 형광펜으로 강조할 부분
  highlight?: string;
  // 형광펜 색 (하늘색 띠 위에서는 흰색이 어울린다)
  highlightColor?: string;
  // 제목 앞에 붙는 작은 장식 그림 (예: 핑크 폭죽)
  icon?: ImageSource | number;
  // 오른쪽 "전체보기 ›"
  onPressMore?: () => void;
};

// 섹션 맨 위의 큼직한 제목 줄 (제목 왼쪽, 전체보기 오른쪽)
export function SectionHeader({ title, eyebrow, highlight, highlightColor, icon, onPressMore }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleWrap}>
        {icon ? <Image source={icon} style={styles.icon} contentFit="contain" /> : null}
        <View style={styles.titleText}>
          {eyebrow ? (
            <AppText weight="bold" size={12} color={colors.brandStrong} style={styles.eyebrow}>
              {eyebrow}
            </AppText>
          ) : null}
          <AppText weight="display" size={18}>
            {renderTitle(title, highlight, highlightColor)}
          </AppText>
        </View>
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

// 제목에서 highlight 부분만 골라 형광펜 칠을 한다
function renderTitle(title: string, highlight?: string, color?: string) {
  const at = highlight ? title.indexOf(highlight) : -1;
  if (!highlight || at < 0) return title;
  return (
    <>
      {title.slice(0, at)}
      <Highlight color={color}>{highlight}</Highlight>
      {title.slice(at + highlight.length)}
    </>
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
  titleText: { gap: 1 },
  eyebrow: { letterSpacing: 1.2 },
  icon: { width: 30, height: 30 },
});
