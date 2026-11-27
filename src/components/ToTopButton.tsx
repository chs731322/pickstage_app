import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/theme';

// 이만큼 내리면 '맨 위로' 버튼을 보여준다
export const TOP_BUTTON_OFFSET = 400;

// 오른쪽 아래에 떠 있는 '맨 위로' 버튼. bottom 은 아래 고정 요소(예매 버튼 줄 등)를 피할 높이.
export function ToTopButton({ onPress, bottom = spacing.md }: { onPress: () => void; bottom?: number }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, { bottom }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel="맨 위로">
      <SymbolView name={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }} tintColor={colors.text} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    // 흰 바탕 위에 떠 있는 버튼이라 옅은 그림자를 준다
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: { opacity: 0.7 },
});
