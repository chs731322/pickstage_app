import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import {
  blockUser,
  createReport,
  REPORT_REASONS,
  REPORT_TARGET_LABEL,
  type ReportReason,
  type ReportTargetType,
} from '@/features/moderation';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

const DETAIL_MAX = 200;

type Props = {
  targetType: ReportTargetType;
  targetId: number;
  // 쓴 사람의 id (차단할 사람)
  authorId: number | null;
  authorName?: string;
  // 차단이 끝난 뒤 화면을 어떻게 바꿀지 (목록에서 빼기 등)
  onBlocked?: (userId: number) => void;
};

// 남이 쓴 글·후기 옆의 ⋯ 메뉴: 신고하기 / 차단하기 (내 글에는 보이지 않는다)
export function ReportBlockMenu({ targetType, targetId, authorId, authorName, onBlocked }: Props) {
  const { user, isLoggedIn } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);

  if (authorId != null && authorId === user?.id) return null;

  const requireLogin = () => {
    if (isLoggedIn) return true;
    Alert.alert('로그인이 필요해요', undefined, [
      { text: '취소', style: 'cancel' },
      { text: '로그인', onPress: () => router.push('/login') },
    ]);
    return false;
  };

  const confirmBlock = () => {
    if (!requireLogin() || authorId == null) return;
    const name = authorName ? `${authorName}님` : '이 사용자';
    Alert.alert(
      `${name}을 차단할까요?`,
      '차단하면 이 사용자의 글·댓글·후기가 더 이상 보이지 않아요. 프로필 > 차단한 사용자에서 언제든 해제할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(authorId);
              onBlocked?.(authorId);
              Alert.alert('차단했어요');
            } catch (error) {
              Alert.alert('차단하지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.'));
            }
          },
        },
      ],
    );
  };

  const openMenu = () => {
    Alert.alert(`${REPORT_TARGET_LABEL[targetType]} 신고·차단`, undefined, [
      {
        text: '신고하기',
        onPress: () => {
          if (requireLogin()) setReportOpen(true);
        },
      },
      ...(authorId != null ? [{ text: '차단하기', style: 'destructive' as const, onPress: confirmBlock }] : []),
      { text: '취소', style: 'cancel' as const },
    ]);
  };

  return (
    <>
      <Pressable onPress={openMenu} hitSlop={12} accessibilityRole="button" accessibilityLabel="신고·차단 메뉴">
        <SymbolView
          name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }}
          tintColor={colors.textMuted}
          size={20}
        />
      </Pressable>
      <ReportSheet
        visible={reportOpen}
        targetType={targetType}
        targetId={targetId}
        onClose={() => setReportOpen(false)}
      />
    </>
  );
}

// 신고 사유를 고르고 접수하는 창 (아래에서 올라오는 시트)
function ReportSheet({
  visible,
  targetType,
  targetId,
  onClose,
}: {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const needsDetail = reason === 'OTHER';
  const canSubmit = reason !== null && (!needsDetail || detail.trim().length > 0);

  const close = () => {
    setReason(null);
    setDetail('');
    onClose();
  };

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await createReport({ targetType, targetId, reason, detail: detail.trim() || undefined });
      close();
      Alert.alert('신고가 접수되었어요', '운영팀이 확인할게요.');
    } catch (error) {
      Alert.alert('신고하지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <AppText weight="bold" size={18}>
            {REPORT_TARGET_LABEL[targetType]} 신고
          </AppText>
          <AppText size={14} color={colors.textSecondary}>
            신고한 사람은 상대방에게 알려지지 않아요.
          </AppText>
          <View style={styles.reasons}>
            {REPORT_REASONS.map((item) => {
              const selected = reason === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setReason(item.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.reason, selected && styles.reasonSelected]}>
                  <AppText weight={selected ? 'bold' : 'medium'} size={16} color={selected ? colors.brand : colors.text}>
                    {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {needsDetail ? (
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={detail}
              onChangeText={setDetail}
              maxLength={DETAIL_MAX}
              multiline
              placeholder="신고 내용을 적어주세요"
              placeholderTextColor={colors.textMuted}
              style={styles.detail}
            />
          ) : null}
          <View style={styles.buttons}>
            <View style={styles.flex}>
              <Button title="취소" variant="secondary" onPress={close} />
            </View>
            <View style={styles.flex}>
              <Button title="신고하기" onPress={submit} loading={submitting} disabled={!canSubmit} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },
  reasons: { gap: spacing.sm, marginTop: spacing.sm },
  reason: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  reasonSelected: { backgroundColor: colors.brandSoft },
  detail: {
    minHeight: 80,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
