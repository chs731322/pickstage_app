import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fontFamily, radius, spacing } from '@/theme';

type Props = TextInputProps & {
  label: string;
  // 입력이 잘못됐을 때 칸 아래에 보여줄 문구
  error?: string | null;
  // 비밀번호 칸: 글자를 가리고 "보기" 버튼을 보여준다
  password?: boolean;
  // 다음 칸으로 넘어가거나 오류가 난 칸으로 돌아갈 때 쓴다 (예: 이메일 → 비밀번호)
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

// 이름표가 붙은 입력칸. 로그인, 회원가입 같은 모든 입력 화면이 함께 쓴다.
export function TextField({ label, error, password = false, style, ref, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrapper}>
      <AppText weight="semibold" size={14} color={colors.textSecondary}>
        {label}
      </AppText>
      <View style={[styles.box, focused && styles.boxFocused, error ? styles.boxError : null]}>
        <TextInput
          ref={ref}
          {...inputProps}
          secureTextEntry={password && !visible}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />
        {password && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? '비밀번호 숨기기' : '비밀번호 보기'}>
            <AppText weight="semibold" size={13} color={colors.textSecondary}>
              {visible ? '숨기기' : '보기'}
            </AppText>
          </Pressable>
        )}
      </View>
      {error ? (
        <AppText size={13} color={colors.danger} accessibilityRole="alert">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs + 2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm + 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  boxFocused: { borderColor: colors.brand },
  boxError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
  },
});
