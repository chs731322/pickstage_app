import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { POST_CATEGORY_LABEL, type PostListItem } from '@/features/community';
import { timeAgo } from '@/lib/postContent';
import { cardShadow, colors, radius, spacing } from '@/theme';

// 커뮤니티 목록의 글 한 장: 카테고리·공연, 제목, 본문 앞부분, 작성자와 반응 수
export function PostCard({ post }: { post: PostListItem }) {
  return (
    <Pressable
      onPress={() => router.push(`/community/${post.id}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${post.title} 글 보기`}>
      <View style={styles.tags}>
        <View style={styles.tag}>
          <AppText weight="bold" size={12} color={colors.brand}>
            {POST_CATEGORY_LABEL[post.category] ?? post.category}
          </AppText>
        </View>
        {post.festivalTitle ? (
          <AppText size={13} color={colors.textMuted} numberOfLines={1} style={styles.flex}>
            {post.festivalTitle}
          </AppText>
        ) : null}
      </View>
      <AppText weight="bold" size={16} numberOfLines={2} style={styles.title}>
        {post.title}
      </AppText>
      {post.preview ? (
        <AppText size={14} color={colors.textSecondary} numberOfLines={2} style={styles.preview}>
          {post.preview}
        </AppText>
      ) : null}
      <View style={styles.footer}>
        <Avatar uri={post.authorProfileImage} name={post.authorNickname ?? '탈'} size={22} />
        <AppText size={13} color={colors.textSecondary} numberOfLines={1} style={styles.author}>
          {post.authorNickname ?? '탈퇴한 회원'} · {timeAgo(post.createdAt)}
        </AppText>
        <Stat icon={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} value={post.likeCount} />
        <Stat icon={{ ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }} value={post.commentCount} />
      </View>
    </Pressable>
  );
}

function Stat({ icon, value }: { icon: { ios: string; android: string; web: string }; value: number }) {
  return (
    <View style={styles.stat}>
      <SymbolView name={icon as never} tintColor={colors.textMuted} size={15} />
      <AppText size={13} color={colors.textMuted}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  pressed: { opacity: 0.85 },
  tags: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  title: { lineHeight: 24 },
  preview: { lineHeight: 22 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  author: { flex: 1 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginLeft: spacing.sm },
});
