import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useCreateReview } from '@/features/venues';
import { errorMessage } from '@/lib/api';
import { colors, fontFamily, radius, spacing } from '@/theme';

const CONTENT_MAX = 1000;

type Props = { venueId: number; venueName: string; visible: boolean; onClose: () => void };

// 공연장 후기 쓰는 창 (아래에서 올라오는 시트): 별점, 후기, 좌석·시야·스탠딩 팁
export function ReviewFormSheet({ venueId, venueName, visible, onClose }: Props) {
  const createReview = useCreateReview(venueId);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [seatSection, setSeatSection] = useState('');
  const [viewInfo, setViewInfo] = useState('');
  const [standingTip, setStandingTip] = useState('');

  const close = () => {
    setRating(5);
    setContent('');
    setSeatSection('');
    setViewInfo('');
    setStandingTip('');
    onClose();
  };

  const submit = () => {
    if (!content.trim()) {
      Alert.alert('후기 내용을 입력해주세요');
      return;
    }
    createReview.mutate(
      {
        venueId,
        rating,
        content: content.trim(),
        seatSection: seatSection.trim() || undefined,
        viewInfo: viewInfo.trim() || undefined,
        standingTip: standingTip.trim() || undefined,
      },
      {
        onSuccess: () => {
          close();
          Alert.alert('후기가 작성되었어요');
        },
        onError: (error) => Alert.alert('후기를 등록하지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.')),
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <AppText weight="extrabold" size={20}>
              {venueName} 후기
            </AppText>

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n}점`}>
                  <SymbolView
                    name={{ ios: n <= rating ? 'star.fill' : 'star', android: n <= rating ? 'star' : 'star_border', web: n <= rating ? 'star' : 'star_border' }}
                    tintColor={n <= rating ? '#ffb400' : colors.clearButton}
                    size={34}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              value={content}
              onChangeText={setContent}
              maxLength={CONTENT_MAX}
              multiline
              placeholder="공연장은 어땠나요? 다녀온 경험을 알려주세요"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.content]}
            />
            <TextInput
              value={seatSection}
              onChangeText={setSeatSection}
              placeholder="좌석 구역 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={viewInfo}
              onChangeText={setViewInfo}
              placeholder="시야 정보 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput
              value={standingTip}
              onChangeText={setStandingTip}
              placeholder="스탠딩 팁 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <AppText size={13} color={colors.textMuted}>
              욕설·비하 등 커뮤니티 이용 규칙에 어긋나는 내용은 등록이 제한될 수 있어요.
            </AppText>

            <View style={styles.buttons}>
              <View style={styles.flex}>
                <Button title="취소" variant="secondary" onPress={close} />
              </View>
              <View style={styles.flex}>
                <Button title="등록" onPress={submit} loading={createReview.isPending} />
              </View>
            </View>
          </ScrollView>
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
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.white,
  },
  body: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xl },
  stars: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
  },
  content: { minHeight: 120, textAlignVertical: 'top' },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
