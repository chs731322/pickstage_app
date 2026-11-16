import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme';

// 동그란 프로필 사진. 사진이 없으면 이름 첫 글자를 보여준다.
export function Avatar({ uri, name, size }: { uri: string | null | undefined; name: string; size: number }) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return uri ? (
    <Image source={{ uri }} style={[styles.base, shape]} contentFit="cover" />
  ) : (
    <View style={[styles.base, styles.empty, shape]}>
      <AppText weight="bold" size={size * 0.4} color={colors.textMuted}>
        {name.slice(0, 1)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface },
  empty: { alignItems: 'center', justifyContent: 'center' },
});
