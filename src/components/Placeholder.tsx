import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

// 아직 만들지 않은 화면의 자리표시. 화면을 만들면서 하나씩 실제 내용으로 바꾼다.
export function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <View style={styles.box}>
      <AppText weight="bold" size={18}>
        {title}
      </AppText>
      <AppText color={colors.textMuted}>{note ?? '준비 중이에요.'}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
