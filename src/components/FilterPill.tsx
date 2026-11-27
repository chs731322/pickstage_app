import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

// 필터·정렬 선택용 알약 버튼 (선 없이 연회색, 선택되면 핑크로 채워진다). 회색 카드 안에 놓을 때는 onCard 로 흰색.
export function FilterPill({ label, active, onPress, onCard = false }: { label: string; active: boolean; onPress: () => void; onCard?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.pill, onCard && styles.onCard, active && styles.active, pressed && (active ? styles.activePressed : styles.pillPressed)]}>
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
    backgroundColor: colors.card,
  },
  onCard: { backgroundColor: colors.white },
  // 눌렀을 때: 선택 안 된 알약은 옅은 핑크, 선택된 알약은 진한 핑크
  pillPressed: { backgroundColor: colors.brandSoft },
  activePressed: { backgroundColor: colors.brandStrong },
  active: { backgroundColor: colors.brand },
});
