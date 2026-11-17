import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { MenuCard, MenuRow } from '@/components/MenuRow';
import { TabHero } from '@/components/TabHero';
import { useInterestedArtists } from '@/features/artists';
import { useBookmarks } from '@/features/bookmarks';
import { useAuth } from '@/lib/auth';
import { openSitePage } from '@/lib/links';
import { colors, spacing } from '@/theme';

export default function MyScreen() {
  const { user, isLoggedIn, signOut } = useAuth();
  const { data: bookmarks } = useBookmarks();
  const { data: artists } = useInterestedArtists();

  const confirmSignOut = () =>
    Alert.alert('로그아웃할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: signOut },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TabHero title="마이" />

        {isLoggedIn && user ? (
          <>
            {/* 프로필: 누르면 내 프로필 화면(다른 회원에게 보이는 모습). 회원정보 수정은 그 안의 링크나 아래 "회원정보"에서 */}
            <Pressable style={styles.profile} onPress={() => router.push(`/user/${user.id}`)} accessibilityRole="button">
              <Avatar uri={user.profileImage} name={user.nickname} size={64} />
              <View style={styles.profileText}>
                <AppText weight="extrabold" size={20}>
                  {user.nickname}
                </AppText>
                <AppText size={14} color={colors.textSecondary}>
                  {user.email}
                </AppText>
              </View>
              <AppText size={20} color={colors.textMuted}>
                ›
              </AppText>
            </Pressable>

            {/* 내 활동 */}
            <MenuCard>
              <MenuRow
                label="찜한 공연"
                icon={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
                value={bookmarks ? `${bookmarks.length}` : undefined}
                onPress={() => router.push('/my/bookmarks')}
              />
              <MenuRow
                label="관심 아티스트"
                icon={{ ios: 'star', android: 'star_border', web: 'star_border' }}
                value={artists ? `${artists.length}` : undefined}
                onPress={() => router.push('/my/artists')}
              />
              <MenuRow
                label="내가 쓴 글"
                icon={{ ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' }}
                onPress={() => router.push('/my/posts')}
              />
              <MenuRow
                label="준비 체크리스트"
                icon={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
                onPress={() => router.push('/checklist')}
              />
            </MenuCard>

            {/* 설정 */}
            <MenuCard>
              <MenuRow
                label="푸시 알림 설정"
                icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
                onPress={() => router.push('/push-settings')}
              />
              <MenuRow
                label="차단한 사용자"
                icon={{ ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }}
                onPress={() => router.push('/my/blocks')}
              />
              <MenuRow
                label="회원정보"
                icon={{ ios: 'person', android: 'person_outline', web: 'person_outline' }}
                onPress={() => router.push('/my/profile')}
              />
            </MenuCard>
          </>
        ) : (
          <View style={styles.guest}>
            <AppText weight="extrabold" size={20}>
              로그인하고 더 편하게 이용해보세요
            </AppText>
            <AppText size={15} color={colors.textSecondary}>
              찜, 알림, 내 취향 공연 추천은 로그인이 필요해요.
            </AppText>
            <View style={styles.guestButton}>
              <Button title="로그인" onPress={() => router.push('/login')} />
            </View>
            <Pressable style={styles.signupLink} onPress={() => router.push('/signup')} hitSlop={8}>
              <AppText color={colors.textSecondary} size={15}>
                아직 회원이 아니신가요?{' '}
                <AppText weight="bold" color={colors.brand} size={15}>
                  회원가입
                </AppText>
              </AppText>
            </Pressable>
          </View>
        )}

        {/* 안내 (로그인 없이도 볼 수 있다) */}
        <MenuCard>
          <MenuRow
            label="공지사항"
            icon={{ ios: 'megaphone', android: 'campaign', web: 'campaign' }}
            onPress={() => router.push('/notices')}
          />
          <MenuRow
            label="이용약관"
            icon={{ ios: 'doc.text', android: 'description', web: 'description' }}
            onPress={() => openSitePage('/terms')}
          />
          <MenuRow
            label="개인정보처리방침"
            icon={{ ios: 'lock', android: 'lock', web: 'lock' }}
            onPress={() => openSitePage('/privacy')}
          />
          <MenuRow
            label="고객센터"
            icon={{ ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' }}
            onPress={() => openSitePage('/faq')}
          />
        </MenuCard>

        {isLoggedIn ? (
          <Pressable onPress={confirmSignOut} style={styles.signOut} hitSlop={8} accessibilityRole="button">
            <AppText weight="semibold" size={16} color={colors.textMuted}>
              로그아웃
            </AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  scroll: { backgroundColor: colors.pageBg },
  content: { gap: spacing.md, padding: spacing.md, paddingTop: 0, paddingBottom: spacing.xl },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
  },
  profileText: { flex: 1, gap: 2 },
  guest: { gap: spacing.sm, padding: spacing.lg, borderRadius: 22, backgroundColor: colors.white },
  guestButton: { marginTop: spacing.sm },
  signupLink: { alignItems: 'center', paddingTop: spacing.sm },
  signOut: { alignItems: 'center', paddingVertical: spacing.md },
});
