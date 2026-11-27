import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AuthCollageLayout } from '@/components/AuthCollageLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { errorMessage } from '@/lib/api';
import { sendPasswordResetEmail } from '@/lib/authApi';
import { emailError } from '@/lib/validation';
import { colors, radius, spacing } from '@/theme';

// 비밀번호 찾기: 가입한 이메일로 재설정 링크를 받는다 (웹과 같은 방식)
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [problem, setProblem] = useState<string | null>(null);
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState('');

  const submit = async () => {
    if (sending) return;
    const invalid = emailError(email);
    setProblem(invalid);
    setServerError('');
    if (invalid) return;
    setSending(true);
    try {
      await sendPasswordResetEmail(email.trim());
      setSentTo(email.trim());
    } catch (error) {
      setServerError(errorMessage(error, '메일을 보내지 못했어요. 잠시 뒤에 다시 시도해주세요.'));
    } finally {
      setSending(false);
    }
  };

  if (sentTo) {
    return (
      <AuthCollageLayout compact title={['메일을', '보냈어요']} subtitle={`${sentTo}\n으로 비밀번호 재설정 링크를 보냈어요.`}>
        <AppText size={14} color={colors.textSecondary} style={styles.center}>
          메일함(스팸함 포함)을 확인하고 링크를 눌러주세요. 새 비밀번호를 정한 뒤 앱에서 다시 로그인하면 돼요.
        </AppText>
        <Button title="로그인으로 돌아가기" onPress={() => router.back()} />
        <Pressable onPress={() => setSentTo('')} style={styles.link} hitSlop={8} accessibilityRole="button">
          <AppText size={14} color={colors.textSecondary}>
            다른 이메일로 다시 받기
          </AppText>
        </Pressable>
      </AuthCollageLayout>
    );
  }

  return (
    <AuthCollageLayout compact title={['비밀번호를', '잊으셨나요?']} subtitle={'가입한 이메일을 입력하면\n비밀번호를 다시 설정할 수 있는 링크를 보내드려요.'}>
      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        error={problem}
        placeholder="가입한 이메일"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      {serverError ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <AppText color={colors.danger} size={14}>
            {serverError}
          </AppText>
        </View>
      ) : null}
      <Button title="재설정 링크 받기" onPress={submit} loading={sending} />
      <AppText size={13} color={colors.textMuted} style={styles.center}>
        카카오·구글·Apple로 가입한 계정은 비밀번호가 없어서 이 방법을 쓸 수 없어요.
      </AppText>
    </AuthCollageLayout>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center', lineHeight: 21 },
  link: { alignSelf: 'center' },
  errorBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
});
