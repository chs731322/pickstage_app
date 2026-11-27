import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  // 오른쪽 끝에 "보기" 같은 보조 동작 (체크박스를 누르는 것과 따로 눌린다)
  trailing?: ReactNode;
  // 굵고 큰 글자 (예: "전체 동의")
  strong?: boolean;
};

// 동의 체크박스: 칸이나 글자 어디를 눌러도 바뀐다
export function Checkbox({ checked, onChange, children, trailing, strong = false }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={() => onChange(!checked)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}>
        <View style={[styles.box, checked && styles.boxChecked]}>
          {checked && (
            <AppText weight="bold" size={14} color={colors.white} style={styles.mark}>
              ✓
            </AppText>
          )}
        </View>
        <AppText weight={strong ? 'bold' : 'regular'} size={strong ? 16 : 14} style={styles.label}>
          {children}
        </AppText>
      </Pressable>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  boxChecked: { borderColor: colors.brand, backgroundColor: colors.brand },
  mark: { lineHeight: 18 },
  label: { flex: 1 },
});
