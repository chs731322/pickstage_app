import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme';

// 체크리스트용 동그란 체크 표시 (체크되면 핑크로 채워진다)
export function ChecklistCheck({ checked, onPress, label }: { checked: boolean; onPress?: () => void; label: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      disabled={!onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={[styles.box, checked && styles.checked]}>
      {checked ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor={colors.white} size={14} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  checked: { backgroundColor: colors.brand, borderColor: colors.brand },
});
