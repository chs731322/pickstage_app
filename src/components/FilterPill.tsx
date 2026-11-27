import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

// 필터·정렬 선택용 알약 버튼 (선택되면 핑크로 채워진다)
export function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.pill, active && styles.active, pressed && (active ? styles.activePressed : styles.pillPressed)]}>
      <AppText weight={active ? 'bold' : 'medium'} size={14} color={active ? colors.white : colors.textSecondary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  // 눌렀을 때: 선택 안 된 알약은 옅은 핑크, 선택된 알약은 진한 핑크
  pillPressed: { backgroundColor: colors.brandSoft, borderColor: colors.brandTint },
  activePressed: { borderColor: colors.brandStrong, backgroundColor: colors.brandStrong },
  active: { borderColor: colors.brand, backgroundColor: colors.brand },
});
