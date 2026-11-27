import * as AppleAuthentication from 'expo-apple-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';

import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, radius, socialColors, spacing } from '@/theme';

type Props = { onError: (message: string) => void };

// Expo Go 로 실행 중인지. Apple 기본 버튼은 "앱의 언어"를 따라서, Expo Go 안에서는 영어로 나온다.
const IN_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// "Apple로 계속하기" 버튼 (아이폰에서만 보인다). Apple이 준 identity token을 서버로 보내 로그인·가입한다.
// 로그인에 성공하면 로그인 상태가 바뀌면서 화면은 자동으로 닫힌다.
export function AppleSignInButton({ onError }: Props) {
  const { signInWithApple } = useAuth();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable, () => setAvailable(false));
  }, []);

  if (!available) return null;

  const handlePress = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) {
        onError('Apple 로그인 정보를 받지 못했어요. 다시 시도해주세요.');
        return;
      }
      // 한국 이름 순서(성 + 이름)로 붙인다. Apple은 이름을 처음 로그인할 때만 준다.
      const { familyName, givenName } = credential.fullName ?? {};
      const fullName = `${familyName ?? ''}${givenName ?? ''}`.trim() || undefined;
      await signInWithApple(credential.identityToken, fullName);
    } catch (error) {
      // 사용자가 직접 닫은 것은 오류가 아니다
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      onError(errorMessage(error, 'Apple 로그인 중 오류가 발생했어요.'));
    }
  };

  // Expo Go 에서만: 다른 버튼과 같은 모양의 한글 버튼. 설치한 앱에서는 심사에 안전한 Apple 기본 버튼을 쓴다.
  if (IN_EXPO_GO) {
    return (
      <Pressable onPress={handlePress} style={({ pressed }) => [styles.custom, pressed && styles.pressed]} accessibilityRole="button">
        <SymbolView name="apple.logo" tintColor={colors.white} size={20} style={styles.logo} />
        <AppText weight="bold" size={16} color={colors.white}>
          Apple로 계속하기
        </AppText>
      </Pressable>
    );
  }

  return (
    <View style={styles.wrap}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={999}
        style={styles.button}
        onPress={handlePress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  button: { height: 48, width: '100%' },
  custom: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: socialColors.apple },
  pressed: { opacity: 0.6 },
  // 카카오·구글 로고와 같은 자리
  logo: { position: 'absolute', left: spacing.lg, width: 20, height: 20 },
});
