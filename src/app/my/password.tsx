import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useChangePassword } from '@/features/me';
import { errorMessage } from '@/lib/api';
import { isValidPassword, PASSWORD_RULE } from '@/lib/validation';
import { colors, spacing } from '@/theme';

// 비밀번호 변경: 현재 비밀번호와 새 비밀번호를 받는다 (카카오·구글 같은 소셜 가입 계정은 서버가 거절한다)
export default function PasswordScreen() {
  const changePassword = useChangePassword();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const nextInvalid = next.length > 0 && !isValidPassword(next);
  const confirmMismatch = confirm.length > 0 && next !== confirm;

  const submit = () => {
    setSubmitted(true);
    setServerError(null);
    if (!current || !isValidPassword(next) || next !== confirm) return;
    changePassword.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          Alert.alert('비밀번호를 바꿨어요');
          router.back();
        },
        onError: (error) => setServerError(errorMessage(error, '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.')),
      },
    );
  };

  return (
    <Screen topInset={false} keyboard tone="page">
      <View style={styles.card}>
        <TextField
          label="현재 비밀번호"
          password
          value={current}
          onChangeText={setCurrent}
          autoCapitalize="none"
          autoComplete="current-password"
          error={submitted && !current ? '현재 비밀번호를 입력해주세요.' : serverError}
        />
        <TextField
          label="새 비밀번호"
          password
          value={next}
          onChangeText={setNext}
          autoCapitalize="none"
          autoComplete="new-password"
          error={nextInvalid || (submitted && !next) ? PASSWORD_RULE : null}
          hint={!nextInvalid ? PASSWORD_RULE : null}
        />
        <TextField
          label="새 비밀번호 확인"
          password
          value={confirm}
          onChangeText={setConfirm}
          autoCapitalize="none"
          autoComplete="new-password"
          error={confirmMismatch ? '비밀번호가 일치하지 않아요.' : null}
        />
        <Button title="변경하기" onPress={submit} loading={changePassword.isPending} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, padding: spacing.md + 2, borderRadius: 22, backgroundColor: colors.white },
});
