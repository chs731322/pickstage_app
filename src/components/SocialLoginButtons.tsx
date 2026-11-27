import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { AppleSignInButton } from '@/components/AppleSignInButton';
import { useAuth } from '@/lib/auth';
import type { SocialProvider } from '@/lib/socialLogin';
import { colors, radius, socialColors, spacing } from '@/theme';

const PROVIDERS: { id: SocialProvider; label: string; icon: number; background: string; border?: string; textColor: string }[] = [
  { id: 'kakao', label: '카카오로 계속하기', icon: require('../../assets/images/brand/kakao.svg'), background: socialColors.kakao, textColor: 'rgba(0,0,0,0.85)' },
  { id: 'google', label: 'Google로 계속하기', icon: require('../../assets/images/brand/google.svg'), background: colors.white, border: colors.border, textColor: colors.text },
];

// 소셜 로그인 버튼 모음: 카카오, 구글, (아이폰에서는) Apple.
// 로그인에 성공하면 로그인 상태가 바뀌면서 화면은 자동으로 닫힌다.
export function SocialLoginButtons({ onError }: { onError: (message: string) => void }) {
  const { signInWithSocial } = useAuth();
  const [busy, setBusy] = useState<SocialProvider | null>(null);

  const handlePress = async (provider: SocialProvider) => {
    if (busy) return;
    setBusy(provider);
    onError('');
    try {
      await signInWithSocial(provider);
    } catch (error) {
      onError(error instanceof Error && error.message ? error.message : '로그인 중 오류가 발생했어요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.wrap}>
      {PROVIDERS.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => handlePress(p.id)}
          disabled={busy !== null}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: p.background },
            p.border ? { borderWidth: 1, borderColor: p.border } : null,
            (pressed || (busy !== null && busy !== p.id)) && styles.dim,
          ]}>
          <Image source={p.icon} style={styles.icon} contentFit="contain" />
          {busy === p.id ? (
            <ActivityIndicator color={p.textColor} />
          ) : (
            <AppText weight="bold" size={16} color={p.textColor}>
              {p.label}
            </AppText>
          )}
        </Pressable>
      ))}
      <AppleSignInButton onError={onError} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  button: { minHeight: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: 0.6 },
  // 로고는 버튼 왼쪽에 고정해서 글자는 가운데에 그대로 둔다
  icon: { position: 'absolute', left: spacing.lg, width: 20, height: 20 },
});
