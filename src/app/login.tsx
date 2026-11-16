import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SocialLoginButtons } from '@/components/SocialLoginButtons';
import { Button } from '@/components/Button';
import { AuthLayout } from '@/components/AuthLayout';
import { TextField } from '@/components/TextField';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { openSitePage } from '@/lib/links';
import { emailError } from '@/lib/validation';
import { colors, radius, spacing } from '@/theme';

// 이메일 로그인. 로그인에 성공하면 로그인 상태가 바뀌면서 이 화면은 자동으로 닫힌다 (src/app/_layout.tsx의 Stack.Protected).
export default function LoginScreen() {
  const { signIn } = useAuth();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 입력 검사 문구는 "로그인"을 눌러본 뒤부터 보여준다 (입력하는 중에 빨갛게 되지 않도록)
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const emailProblem = submitted ? emailError(email) : null;
  const passwordProblem = submitted && !password ? '비밀번호를 입력해주세요.' : null;

  async function handleSubmit() {
    if (isSubmitting) return;
    setSubmitted(true);
    setServerError('');
    if (emailError(email) || !password) return;

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (error) {
      // 서버가 보내준 문구를 그대로 보여준다 (예: 이메일·비밀번호 불일치, 이용 정지된 계정)
      setServerError(errorMessage(error, '로그인 중 오류가 발생했어요.'));
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout title="다시 만나서 반가워요" subtitle={'로그인하고 내 취향 공연을 놓치지 마세요.'}>
      <TextField
        label="이메일"
        value={email}
        onChangeText={setEmail}
        error={emailProblem}
        placeholder="이메일을 입력해주세요"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
      />
      <TextField
        ref={passwordRef}
        label="비밀번호"
        value={password}
        onChangeText={setPassword}
        error={passwordProblem}
        placeholder="비밀번호를 입력해주세요"
        password
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleSubmit}
      />

      {serverError ? (
        <View style={styles.errorBox} accessibilityRole="alert">
          <AppText color={colors.danger} size={14}>
            {serverError}
          </AppText>
        </View>
      ) : null}

      <Button title="로그인" onPress={handleSubmit} loading={isSubmitting} />

      {/* 소셜 로그인: 카카오, 구글, (아이폰에서만) Apple */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <AppText color={colors.textMuted} size={13}>
          또는
        </AppText>
        <View style={styles.dividerLine} />
      </View>
      <SocialLoginButtons onError={setServerError} />
      <AppText color={colors.textMuted} size={12} style={styles.terms}>
        소셜 로그인으로 계속하면{' '}
        <AppText color={colors.textSecondary} size={12} style={styles.underline} onPress={() => openSitePage('/terms')}>
          이용약관
        </AppText>
        과{' '}
        <AppText color={colors.textSecondary} size={12} style={styles.underline} onPress={() => openSitePage('/privacy')}>
          개인정보처리방침
        </AppText>
        에 동의한 것으로 봐요.
      </AppText>

      <View style={styles.links}>
        <Link href="/forgot-password">
          <AppText color={colors.textSecondary} size={14}>
            비밀번호를 잊으셨나요?
          </AppText>
        </Link>
        <AppText color={colors.border}>|</AppText>
        <Link href="/signup">
          <AppText weight="bold" color={colors.brand} size={14}>
            회원가입
          </AppText>
        </Link>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    padding: spacing.md,
    borderRadius: radius.sm + 4,
    backgroundColor: '#fff2f2',
  },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  terms: { textAlign: 'center', lineHeight: 18 },
  underline: { textDecorationLine: 'underline' },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
