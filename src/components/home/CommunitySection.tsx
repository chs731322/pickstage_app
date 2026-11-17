import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PostCard } from '@/components/PostCard';
import { SectionHeader } from '@/components/SectionHeader';
import { usePosts } from '@/features/community';
import { useAuth } from '@/lib/auth';
import { colors, radius, spacing } from '@/theme';

const PREVIEW_SIZE = 3;

// 홈의 "동행 구하는 커뮤니티": 같은 공연 가는 사람을 찾는 최신 동행 글
export function CommunitySection() {
  const { isLoggedIn } = useAuth();
  const { data } = usePosts('companion', 'latest');
  const posts = data?.pages[0]?.content.slice(0, PREVIEW_SIZE) ?? [];

  const handleWrite = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 글을 쓸 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    router.push({ pathname: '/community/write', params: { category: 'companion' } });
  };

  return (
    <View style={styles.section}>
      <SectionHeader title="동행 구하는 커뮤니티" onPressMore={() => router.push('/community')} />
      <AppText size={15} color={colors.textSecondary} style={styles.desc}>
        같은 공연 가는 사람을 찾아보세요.
      </AppText>
      <View style={styles.list}>
        {posts.length === 0 ? (
          <AppText color={colors.textMuted} size={15}>
            아직 동행 글이 없어요. 첫 글을 남겨보세요.
          </AppText>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
        <Pressable onPress={handleWrite} style={({ pressed }) => [styles.write, pressed && styles.writePressed]} accessibilityRole="button">
          <AppText weight="bold" size={16} color={colors.white}>
            동행 글 쓰기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  desc: { paddingHorizontal: spacing.md },
  list: { gap: spacing.sm + 2, paddingHorizontal: spacing.md, marginTop: spacing.xs },
  writePressed: { backgroundColor: colors.brandStrong },
  write: { height: 52, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
