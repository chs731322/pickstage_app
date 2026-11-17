import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { cardShadow, colors, spacing } from '@/theme';

type Props = {
  label: string;
  icon: { ios: string; android: string; web: string };
  onPress: () => void;
  // 오른쪽에 보이는 값 (예: 개수)
  value?: string;
  danger?: boolean;
};

// 마이 탭의 한 줄 메뉴: 아이콘, 이름, (값), 화살표
export function MenuRow({ label, icon, onPress, value, danger = false }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
      {/* 옅은 핑크 동그라미 안의 아이콘 */}
      <View style={[styles.iconCircle, danger && styles.iconCircleDanger]}>
        <SymbolView name={icon as never} tintColor={danger ? colors.danger : colors.brand} size={20} />
      </View>
      <AppText weight="medium" size={17} color={danger ? colors.danger : colors.text} style={styles.label}>
        {label}
      </AppText>
      {value ? (
        <AppText size={15} color={colors.textMuted}>
          {value}
        </AppText>
      ) : null}
      <AppText size={20} color={colors.textMuted}>
        ›
      </AppText>
    </Pressable>
  );
}

// 메뉴 줄들을 담는 흰 둥근 카드
export function MenuCard({ children }: { children: React.ReactNode }) {
  // 그림자는 바깥 View, 모서리 자르기는 안쪽 View가 맡는다 (iOS는 한 View에서 둘을 같이 못 쓴다)
  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 12, paddingHorizontal: spacing.md },
  pressed: { backgroundColor: colors.surface },
  iconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  iconCircleDanger: { backgroundColor: '#fff0f0' },
  label: { flex: 1 },
  card: { borderRadius: 22, backgroundColor: colors.white, ...cardShadow },
  cardInner: { borderRadius: 22, overflow: 'hidden' },
});
