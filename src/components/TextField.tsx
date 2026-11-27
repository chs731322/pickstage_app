import { useEffect, useRef, useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

type Props = TextInputProps & {
  label: string;
  // 이름표를 화면에 보이지 않게 한다 (placeholder 가 대신하는 화면). 화면 읽기에는 그대로 읽어준다
  hideLabel?: boolean;
  // 입력이 잘못됐을 때 칸 아래에 보여줄 문구 (빨간색)
  error?: string | null;
  // 입력이 맞을 때 칸 아래에 보여줄 문구 (초록색, 예: "사용 가능한 닉네임입니다.")
  success?: string | null;
  // 입력 규칙 같은 안내 문구 (회색)
  hint?: string | null;
  // 비밀번호 칸: 글자를 가리고 "보기" 버튼을 보여준다
  password?: boolean;
  // 입력 중에 보이는 "×" 버튼으로 한 번에 지울 수 있게 한다 (기본 켜짐)
  clearable?: boolean;
  // 다음 칸으로 넘어가거나 오류가 난 칸으로 돌아갈 때 쓴다 (예: 이메일 → 비밀번호)
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

// 이름표가 붙은 입력칸. 로그인, 회원가입 같은 모든 입력 화면이 함께 쓴다.
export function TextField({
  label,
  hideLabel = false,
  error,
  success,
  hint,
  password = false,
  clearable = true,
  style,
  ref,
  ...inputProps
}: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  // 포커스를 잃은 직후에도 ×를 잠깐 남겨둔다: ×를 누르는 순간 입력칸이 포커스를 잃는 환경(웹)에서도 눌림이 끝나기 전에 ×가 사라지지 않게
  const [clearLingering, setClearLingering] = useState(false);
  const lingerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const innerRef = useRef<ComponentRef<typeof TextInput> | null>(null);

  useEffect(() => () => {
    if (lingerTimer.current) clearTimeout(lingerTimer.current);
  }, []);

  // 바깥에서 받은 ref(다음 칸으로 포커스 이동용)와 이 컴포넌트 안에서 쓰는 ref를 함께 채운다
  function setRefs(node: ComponentRef<typeof TextInput> | null) {
    innerRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  }

  const hasText = typeof inputProps.value === 'string' && inputProps.value.length > 0;
  const showClear = clearable && (focused || clearLingering) && hasText && inputProps.editable !== false;

  function clear() {
    inputProps.onChangeText?.('');
    // 지운 뒤에도 키보드가 내려가지 않고 바로 이어서 입력할 수 있게 다시 포커스를 준다
    innerRef.current?.focus();
  }

  return (
    <View style={styles.wrapper}>
      {hideLabel ? null : (
        <AppText weight="medium" size={13} color={colors.textSecondary}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.box,
          focused && styles.boxFocused,
          error ? styles.boxError : null,
          inputProps.editable === false && styles.boxDisabled,
        ]}>
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          ref={setRefs}
          accessibilityLabel={label}
          {...inputProps}
          secureTextEntry={password && !visible}
          onFocus={(event) => {
            if (lingerTimer.current) clearTimeout(lingerTimer.current);
            setFocused(true);
            setClearLingering(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            lingerTimer.current = setTimeout(() => setClearLingering(false), 250);
            inputProps.onBlur?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, style]}
        />
        {showClear && (
          <Pressable
            onPress={clear}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="입력 내용 지우기"
            style={styles.clear}>
            <AppText weight="bold" size={14} color={colors.white} style={styles.clearMark}>
              ×
            </AppText>
          </Pressable>
        )}
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
      ) : success ? (
        <AppText size={13} color={colors.success}>
          {success}
        </AppText>
      ) : hint ? (
        <AppText size={13} color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.softBorder,
    backgroundColor: colors.background,
  },
  boxFocused: { borderColor: colors.focus },
  boxError: { borderColor: colors.danger },
  boxDisabled: { backgroundColor: colors.surface },
  input: {
    flex: 1,
    paddingVertical: spacing.ms,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
  },
  // 동그란 회색 배경에 흰 ×
  clear: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.clearButton,
  },
  clearMark: { lineHeight: 16, marginTop: -1 },
});
