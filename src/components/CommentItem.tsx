import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { ReportBlockMenu } from '@/components/ReportBlockMenu';
import type { Comment } from '@/features/community';
import { timeAgo } from '@/lib/postContent';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

type Props = {
  comment: Comment;
  isMine: boolean;
  // 답글은 한 단계까지만 (답글에는 답글 버튼이 없다)
  isReply?: boolean;
  onReply?: () => void;
  onSaveEdit: (content: string) => Promise<void>;
  onDelete: () => void;
  onBlocked: (userId: number) => void;
};

// 댓글 한 줄: 작성자, 시간, 내용, 답글·수정·삭제(내 댓글) 또는 신고·차단(남의 댓글)
export function CommentItem({ comment, isMine, isReply = false, onReply, onSaveEdit, onDelete, onBlocked }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!draft.trim()) {
      Alert.alert('댓글 내용을 입력해주세요');
      return;
    }
    setSaving(true);
    try {
      await onSaveEdit(draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.row, isReply && styles.reply]}>
      <Pressable disabled={comment.authorId === null} onPress={() => router.push(`/user/${comment.authorId}`)} accessibilityRole="button" accessibilityLabel={`${comment.authorNickname ?? '작성자'} 프로필 보기`}>
        <Avatar uri={comment.authorProfileImage} name={comment.authorNickname ?? '탈'} size={isReply ? 28 : 34} />
      </Pressable>
      <View style={styles.main}>
        <View style={styles.head}>
          <Pressable disabled={comment.authorId === null} onPress={() => router.push(`/user/${comment.authorId}`)} style={styles.name} hitSlop={4}>
            <AppText weight="bold" size={14} numberOfLines={1}>
              {comment.authorNickname ?? '탈퇴한 회원'}
            </AppText>
          </Pressable>
          <AppText size={13} color={colors.textMuted}>
            {timeAgo(comment.createdAt)}
          </AppText>
          {!isMine ? (
            <ReportBlockMenu
              targetType="COMMENT"
              targetId={comment.id}
              authorId={comment.authorId}
              authorName={comment.authorNickname ?? undefined}
              onBlocked={onBlocked}
            />
          ) : null}
        </View>

        {editing ? (
          <View style={styles.edit}>
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={1000}
              autoFocus
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.editButtons}>
              <Pressable onPress={() => { setEditing(false); setDraft(comment.content); }} hitSlop={8}>
                <AppText weight="semibold" size={14} color={colors.textSecondary}>
                  취소
                </AppText>
              </Pressable>
              <Pressable onPress={save} disabled={saving} hitSlop={8}>
                <AppText weight="bold" size={14} color={colors.brand}>
                  {saving ? '저장 중...' : '저장'}
                </AppText>
              </Pressable>
            </View>
          </View>
        ) : (
          <AppText size={16} style={styles.content} selectable>
            {comment.content}
          </AppText>
        )}

        {!editing ? (
          <View style={styles.actions}>
            {!isReply && onReply ? (
              <Pressable onPress={onReply} hitSlop={8}>
                <AppText weight="semibold" size={13} color={colors.textSecondary}>
                  답글
                </AppText>
              </Pressable>
            ) : null}
            {isMine ? (
              <>
                <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                  <AppText weight="semibold" size={13} color={colors.textSecondary}>
                    수정
                  </AppText>
                </Pressable>
                <Pressable onPress={onDelete} hitSlop={8}>
                  <AppText weight="semibold" size={13} color={colors.danger}>
                    삭제
                  </AppText>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.ms, paddingVertical: spacing.ms },
  reply: { marginLeft: 40 },
  main: { flex: 1, gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { flexShrink: 1, marginRight: 2, flex: 1 },
  content: { lineHeight: 23 },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
  edit: { gap: spacing.sm },
  input: {
    minHeight: 64,
    padding: spacing.ms,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  editButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg },
});
