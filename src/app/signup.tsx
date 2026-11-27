import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Checkbox } from '@/components/Checkbox';
import { AuthCollageLayout } from '@/components/AuthCollageLayout';
import { TextField } from '@/components/TextField';
import { errorMessage } from '@/lib/api';
import { checkEmailAvailable, checkNicknameAvailable, sendEmailCode, signUp, verifyEmailCode } from '@/lib/authApi';
import { useAuth } from '@/lib/auth';
import {
  PASSWORD_RULE,
  emailError as checkEmailFormat,
  isValidNickname,
  isValidPassword,
} from '@/lib/validation';
import { colors, radius, spacing } from '@/theme';

type EmailStep = 'input' | 'codeSent' | 'verified';
type NicknameStatus = 'unchecked' | 'available' | 'taken';

const RESEND_SECONDS = 30;

// 회원가입: 한 화면에서 위에서 아래로 차례로 진행한다.
// 1) 이메일 인증 (인증번호 받기 → 번호 입력)  2) 비밀번호·닉네임  3) 약관 동의 → 가입하기
// 이메일 인증이 끝나야 2), 3)이 나타난다. 가입에 성공하면 바로 로그인되고 이 화면은 자동으로 닫힌다.
export default function SignupScreen() {
  const { applyAuthResult } = useAuth();

  // 1) 이메일 인증
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState<EmailStep>('input');
  const [emailProblem, setEmailProblem] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [code, setCode] = useState('');
  const [codeProblem, setCodeProblem] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // 2) 비밀번호·닉네임
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>('unchecked');
  const [nicknameMessage, setNicknameMessage] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  // 3) 약관 동의
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // "다시 보내기"까지 남은 시간
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const trimmedEmail = email.trim();
  const verified = emailStep === 'verified';

  function resetEmailVerification() {
    setEmailStep('input');
    setEmailProblem(null);
    setEmailNotice(null);
    setCode('');
    setCodeProblem(null);
    setCooldown(0);
  }

  // 인증번호를 받은 뒤 이메일을 고치면, 이전 인증은 무효이므로 처음부터 다시 한다
  function handleEmailChange(value: string) {
    setEmail(value);
    if (emailStep !== 'input') resetEmailVerification();
    setEmailProblem(null);
  }

  async function handleSendCode() {
    if (isSending) return;
    const problem = checkEmailFormat(email);
    if (problem) {
      setEmailProblem(problem);
      return;
    }
    setIsSending(true);
    setEmailProblem(null);
    try {
      await checkEmailAvailable(trimmedEmail);
      await sendEmailCode(trimmedEmail);
      setEmailStep('codeSent');
      setCode('');
      setCodeProblem(null);
      setEmailNotice('인증번호를 보냈어요. 메일함을 확인해주세요. (5분 안에 입력)');
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      setEmailProblem(errorMessage(error, '인증번호를 보내지 못했어요.'));
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerifyCode() {
    if (isVerifying) return;
    if (!/^\d{6}$/.test(code)) {
      setCodeProblem('인증번호 숫자 6자리를 입력해주세요.');
      return;
    }
    setIsVerifying(true);
    setCodeProblem(null);
    try {
      await verifyEmailCode(trimmedEmail, code);
      setEmailStep('verified');
      setEmailNotice(null);
    } catch (error) {
      setCodeProblem(errorMessage(error, '인증번호를 확인하지 못했어요.'));
    } finally {
      setIsVerifying(false);
    }
  }

  function handleNicknameChange(value: string) {
    setNickname(value);
    setNicknameStatus('unchecked');
    setNicknameMessage('');
  }

  async function handleCheckNickname() {
    if (isCheckingNickname || !isValidNickname(nickname)) return;
    setIsCheckingNickname(true);
    try {
      const result = await checkNicknameAvailable(nickname.trim());
      setNicknameStatus(result.available ? 'available' : 'taken');
      setNicknameMessage(result.message);
    } catch (error) {
      setNicknameStatus('unchecked');
      setNicknameMessage(errorMessage(error, '닉네임을 확인하지 못했어요.'));
    } finally {
      setIsCheckingNickname(false);
    }
  }

  const passwordProblem = password && !isValidPassword(password) ? PASSWORD_RULE : null;
  const confirmProblem = passwordConfirm && passwordConfirm !== password ? '비밀번호가 일치하지 않아요.' : null;
  const nicknameLengthProblem =
    nickname.trim().length === 1 ? '닉네임은 2자 이상이어야 해요.' : null;

  // 가입하기를 누를 수 없을 때, 무엇이 남았는지 알려준다 (위에서부터 첫 번째 것)
  function missingStep(): string | null {
    if (!isValidPassword(password)) return '비밀번호를 조건에 맞게 입력해주세요.';
    if (passwordConfirm !== password) return '비밀번호 확인을 똑같이 입력해주세요.';
    if (!isValidNickname(nickname)) return '닉네임을 2~10자로 입력해주세요.';
    if (nicknameStatus !== 'available') return '닉네임 중복 확인을 해주세요.';
    if (!agreeTerms || !agreePrivacy) return '필수 약관에 동의해주세요.';
    return null;
  }
  const missing = missingStep();
  const canSubmit = verified && missing === null && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const result = await signUp({ email: trimmedEmail, password, nickname: nickname.trim() });
      await applyAuthResult(result);
    } catch (error) {
      setSubmitError(errorMessage(error, '회원가입 중 오류가 발생했어요.'));
      setIsSubmitting(false);
    }
  }

  const allAgreed = agreeTerms && agreePrivacy;

  return (
    <AuthCollageLayout compact title={['처음이라', '더 반가워요']} subtitle="이메일 인증을 하고 PICKSTAGE를 시작해보세요.">
      {/* 1. 이메일 인증 */}
      <View style={styles.section}>
        <AppText weight="bold" size={18}>
          이메일 인증
        </AppText>

        <TextField
          label="이메일"
          value={email}
          onChangeText={handleEmailChange}
          editable={!verified}
          error={emailProblem}
          success={verified ? '이메일 인증이 완료됐어요.' : emailNotice}
          placeholder="이메일을 입력해주세요"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={handleSendCode}
        />

        {verified ? (
          <Pressable onPress={resetEmailVerification} hitSlop={8} style={styles.textButton}>
            <AppText color={colors.textSecondary} size={13} style={styles.underline}>
              다른 이메일로 변경
            </AppText>
          </Pressable>
        ) : (
          <Button
            title={emailStep === 'codeSent' ? (cooldown > 0 ? `다시 보내기 (${cooldown}초)` : '인증번호 다시 받기') : '인증번호 받기'}
            variant={emailStep === 'codeSent' ? 'secondary' : 'primary'}
            onPress={handleSendCode}
            loading={isSending}
            disabled={emailStep === 'codeSent' && cooldown > 0}
          />
        )}

        {emailStep === 'codeSent' && (
          <>
            <TextField
              label="인증번호"
              value={code}
              onChangeText={(value) => {
                setCode(value.replace(/\D/g, ''));
                setCodeProblem(null);
              }}
              error={codeProblem}
              placeholder="숫자 6자리"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              returnKeyType="done"
              onSubmitEditing={handleVerifyCode}
            />
            <Button title="인증번호 확인" onPress={handleVerifyCode} loading={isVerifying} />
          </>
        )}
      </View>

      {verified && (
        <>
          {/* 2. 비밀번호와 닉네임 */}
          <View style={styles.section}>
            <AppText weight="bold" size={18}>
              비밀번호와 닉네임
            </AppText>
            <TextField
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              error={passwordProblem}
              hint={PASSWORD_RULE}
              placeholder="비밀번호를 입력해주세요"
              password
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="비밀번호 확인"
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              error={confirmProblem}
              placeholder="비밀번호를 한 번 더 입력해주세요"
              password
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <TextField
              label="닉네임"
              value={nickname}
              onChangeText={handleNicknameChange}
              error={nicknameLengthProblem ?? (nicknameStatus === 'taken' ? nicknameMessage : null)}
              success={nicknameStatus === 'available' ? nicknameMessage : null}
              hint="다른 회원에게 보이는 이름이에요. 2~10자로 입력해주세요."
              placeholder="닉네임을 입력해주세요"
              maxLength={10}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title="닉네임 중복 확인"
              variant="secondary"
              onPress={handleCheckNickname}
              loading={isCheckingNickname}
              disabled={!isValidNickname(nickname)}
            />
          </View>

          {/* 3. 약관 동의 */}
          <View style={styles.section}>
            <AppText weight="bold" size={18}>
              약관 동의
            </AppText>
            <View style={styles.agreements}>
              <Checkbox
                strong
                checked={allAgreed}
                onChange={(next) => {
                  setAgreeTerms(next);
                  setAgreePrivacy(next);
                }}>
                전체 동의
              </Checkbox>
              <View style={styles.divider} />
              <Checkbox
                checked={agreeTerms}
                onChange={setAgreeTerms}
                trailing={<ViewLink label="보기" onPress={() => router.push('/terms')} />}>
                (필수) 이용약관 및 커뮤니티 이용 규칙에 동의합니다
              </Checkbox>
              <Checkbox
                checked={agreePrivacy}
                onChange={setAgreePrivacy}
                trailing={<ViewLink label="보기" onPress={() => router.push('/privacy')} />}>
                (필수) 개인정보 수집·이용에 동의합니다
              </Checkbox>
            </View>
          </View>

          {submitError ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <AppText color={colors.danger} size={14}>
                {submitError}
              </AppText>
            </View>
          ) : null}

          <Button title="가입하기" onPress={handleSubmit} loading={isSubmitting} disabled={!canSubmit} />
          {missing ? (
            <AppText color={colors.textMuted} size={13} style={styles.center}>
              {missing}
            </AppText>
          ) : null}
        </>
      )}

      <View style={styles.footer}>
        <AppText color={colors.textSecondary} size={14}>
          이미 계정이 있으신가요?
        </AppText>
        <Link href="/login" dismissTo>
          <AppText weight="bold" color={colors.brand} size={14}>
            로그인
          </AppText>
        </Link>
      </View>
    </AuthCollageLayout>
  );
}

// 약관 옆의 작은 "보기" 링크
function ViewLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link">
      <AppText color={colors.textSecondary} size={13} style={styles.underline}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md, marginTop: spacing.sm },
  textButton: { alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
  agreements: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  divider: { height: 1, marginVertical: spacing.sm, backgroundColor: colors.border },
  errorBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  center: { textAlign: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
