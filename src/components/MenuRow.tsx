import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

type Props = {
  label: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
  // 오른쪽에 보이는 값 (예: 개수)
  value?: string;
  danger?: boolean;
};

// 프로필 탭의 한 줄 메뉴: 아이콘, 이름, (값), 화살표
export function MenuRow({ label, icon, onPress, value, danger = false }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
      <SymbolView name={icon as never} tintColor={danger ? colors.danger : colors.textMuted} size={22} />
      <AppText weight="medium" size={16} color={danger ? colors.danger : colors.text} style={styles.label}>
        {label}
      </AppText>
      {value ? (
        <AppText size={14} color={colors.textMuted}>
          {value}
        </AppText>
      ) : null}
      <AppText size={18} color={colors.textMuted}>
        ›
      </AppText>
    </Pressable>
  );
}

// 메뉴 줄들을 담는 흰 둥근 카드
export function MenuCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  pressed: { backgroundColor: colors.surface },
  label: { flex: 1 },
  card: { borderRadius: radius.lg, backgroundColor: colors.card, overflow: 'hidden' },
});
