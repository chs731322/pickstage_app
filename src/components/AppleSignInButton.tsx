import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Props = { onError: (message: string) => void };

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
});
