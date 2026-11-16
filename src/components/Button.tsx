import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius } from '@/theme';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
  // 처리 중: 글자 대신 로딩 표시를 보여주고 다시 눌리지 않게 한다
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...props }: Props) {
  const primary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      {...props}
      style={(state) => [
        styles.base,
        primary ? styles.primary : styles.secondary,
        inactive && styles.inactive,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? colors.white : colors.text} />
      ) : (
        <AppText weight="bold" size={16} color={primary ? colors.white : colors.text}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: radius.pill,
  },
  primary: { backgroundColor: colors.brand },
  secondary: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.8 },
});
