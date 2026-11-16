import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PageTitle } from '@/components/PageTitle';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/lib/auth';
import { colors, radius, spacing } from '@/theme';

export default function MyScreen() {
  const { user, isLoggedIn, signOut } = useAuth();

  return (
    <Screen>
      <PageTitle>마이</PageTitle>

      {isLoggedIn ? (
        <View style={styles.profile}>
          <AppText weight="bold" size={18}>
            {user?.nickname}
          </AppText>
          <AppText color={colors.textSecondary}>{user?.email}</AppText>
          <Pressable style={styles.secondaryButton} onPress={signOut}>
            <AppText weight="semibold">로그아웃</AppText>
          </Pressable>
        </View>
      ) : (
        <View style={styles.profile}>
          <AppText weight="bold" size={18}>
            로그인하고 더 편하게 이용해보세요
          </AppText>
          <AppText color={colors.textSecondary}>찜, 알림, 내 취향 공연 추천은 로그인이 필요해요.</AppText>
          <Pressable style={styles.primaryButton} onPress={() => router.push('/login')}>
            <AppText weight="bold" color={colors.white}>
              로그인
            </AppText>
          </Pressable>
          <Pressable style={styles.signupLink} onPress={() => router.push('/signup')} hitSlop={8}>
            <AppText color={colors.textSecondary} size={14}>
              아직 회원이 아니신가요?{' '}
              <AppText weight="bold" color={colors.brand} size={14}>
                회원가입
              </AppText>
            </AppText>
          </Pressable>
        </View>
      )}

      <Placeholder title="찜한 공연 · 관심 아티스트 · 내 활동" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  primaryButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  signupLink: { alignItems: 'center', paddingTop: spacing.sm },
  secondaryButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
});
