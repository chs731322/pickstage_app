import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { type PostListItem } from '@/features/community';
import { timeAgo } from '@/lib/postContent';
import { brandScale, cardShadow, colors, radius, spacing } from '@/theme';

// 홈의 동행 글을 말풍선으로 보여준다: 글쓴이 사진이 한쪽에 있고 말풍선이 그 옆에 붙는다. flip이면 좌우를 바꿔서 대화처럼 번갈아 놓는다.
export function PostBubble({ post, flip }: { post: PostListItem; flip?: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/community/${post.id}`)}
      style={({ pressed }) => [styles.row, flip && styles.rowFlip, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${post.title} 글 보기`}>
      <View style={styles.avatar}>
        <Avatar uri={post.authorProfileImage} name={post.authorNickname ?? '탈'} size={44} />
      </View>
      <View style={[styles.bubble, flip ? styles.bubbleFlip : styles.bubbleNormal]}>
        <AppText weight="bold" size={18} color={brandScale[300]} style={styles.quote}>
          “
        </AppText>
        <AppText weight="bold" size={16} numberOfLines={2} style={styles.title}>
          {post.title}
        </AppText>
        {post.preview ? (
          <AppText size={14} color={colors.textSecondary} numberOfLines={2} style={styles.preview}>
            {post.preview}
          </AppText>
        ) : null}
        <AppText size={12} color={colors.textMuted} numberOfLines={1}>
          {post.authorNickname ?? '탈퇴한 회원'} · {timeAgo(post.createdAt)} · 댓글 {post.commentCount}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  rowFlip: { flexDirection: 'row-reverse' },
  pressed: { opacity: 0.85 },
  // 연회색 바탕에서도 아바타가 보이게 흰 원과 그림자를 깐다
  avatar: { borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  // 말풍선: 아바타 쪽 아래 모서리만 각지게 해서 말하는 사람을 가리킨다
  bubble: { flex: 1, gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  bubbleNormal: { borderBottomLeftRadius: 6 },
  bubbleFlip: { borderBottomRightRadius: 6 },
  quote: { lineHeight: 22, height: 18 },
  title: { lineHeight: 22 },
  preview: { lineHeight: 20 },
});
