import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { buttonGradient, colors, radius } from '@/theme';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  // primary: 핑크 그라데이션 / secondary: 흰 바탕에 은은한 테두리
  variant?: 'primary' | 'secondary';
  // 처리 중: 글자 대신 로딩 표시를 보여주고 다시 눌리지 않게 한다
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, style, ...props }: Props) {
  const primary = variant === 'primary';
  const inactive = disabled || loading;

  return (
    // 그림자는 바깥 View에 준다 (안쪽 Pressable은 둥근 모서리로 내용을 잘라내서, 거기에 주면 그림자도 잘린다)
    <View style={[primary && styles.shadow, inactive && styles.inactive]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        {...props}
        style={(state) => [
          styles.base,
          !primary && styles.secondary,
          state.pressed && styles.pressed,
          typeof style === 'function' ? style(state) : style,
        ]}>
        {primary && (
          <LinearGradient
            colors={buttonGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {loading ? (
          <ActivityIndicator color={primary ? colors.white : colors.text} />
        ) : (
          <AppText weight="bold" size={16} color={primary ? colors.white : colors.text}>
            {title}
          </AppText>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  secondary: { backgroundColor: colors.surface },
  shadow: {
    borderRadius: radius.pill,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
