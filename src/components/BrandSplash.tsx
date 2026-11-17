import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

// 앱을 처음 열 때(글꼴·로그인 정보를 불러오는 동안) 보이는 화면: 핫핑크 배경에 흰색 로고.
// 앱 설치본의 시작 화면(app.json의 expo-splash-screen)과 같은 모양이라 끊김 없이 이어진다.
export function BrandSplash() {
  return (
    <View style={styles.wrap}>
      <StatusBar style="light" />
      <Image source={require('../../assets/images/logo-white.png')} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brand },
  logo: { width: 200, height: (200 * 282) / 395 },
});
