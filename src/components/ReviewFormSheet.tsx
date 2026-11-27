import { Image } from 'expo-image';
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
import { pickAndUploadImages } from '@/features/community';
import { errorMessage } from '@/lib/api';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

const CONTENT_MAX = 1000;
// 서버 제한과 같다 (ReviewService.IMAGES_MAX_COUNT)
const PHOTO_MAX = 5;

export type ReviewValues = {
  rating: number;
  content: string;
  seatSection?: string;
  viewInfo?: string;
  standingTip?: string;
  // 새 후기: 올린 사진 주소 / 수정: 사진을 바꿨을 때만 전체 목록 (안 바꾸면 서버의 사진을 그대로 둔다)
  images?: string[];
};

type Props = {
  title: string;
  visible: boolean;
  onClose: () => void;
  // 수정할 때 처음에 채워둘 값 (없으면 새로 쓰기)
  initial?: Partial<Record<'content' | 'seatSection' | 'viewInfo' | 'standingTip', string | null>> & { rating?: number; images?: string[] | null };
  // 저장 요청. 실패하면 예외를 던지면 된다 (오류 안내는 시트가 한다).
  onSubmit: (values: ReviewValues) => Promise<void>;
  submitLabel?: string;
  successMessage: string;
};

// 공연장 후기 쓰는·고치는 창 (아래에서 올라오는 시트): 별점, 후기, 사진, 좌석·시야·스탠딩 팁
export function ReviewFormSheet({ title, visible, onClose, initial, onSubmit, submitLabel = '등록', successMessage }: Props) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [content, setContent] = useState(initial?.content ?? '');
  const [seatSection, setSeatSection] = useState(initial?.seatSection ?? '');
  const [viewInfo, setViewInfo] = useState(initial?.viewInfo ?? '');
  const [standingTip, setStandingTip] = useState(initial?.standingTip ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [imagesChanged, setImagesChanged] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);

  // 닫을 때 입력을 처음 값으로 되돌린다 (새로 쓰기는 비운다)
  const reset = () => {
    setRating(initial?.rating ?? 5);
    setContent(initial?.content ?? '');
    setSeatSection(initial?.seatSection ?? '');
    setViewInfo(initial?.viewInfo ?? '');
    setStandingTip(initial?.standingTip ?? '');
    setImages(initial?.images ?? []);
    setImagesChanged(false);
  };

  const addPhotos = async () => {
    setUploading(true);
    try {
      const urls = await pickAndUploadImages(PHOTO_MAX - images.length);
      if (urls.length > 0) {
        setImages((prev) => [...prev, ...urls].slice(0, PHOTO_MAX));
        setImagesChanged(true);
      }
    } catch (error) {
      Alert.alert('사진을 올리지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    setImagesChanged(true);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!content.trim()) {
      Alert.alert('후기 내용을 입력해주세요');
      return;
    }
    setPending(true);
    try {
      await onSubmit({
        rating,
        content: content.trim(),
        seatSection: seatSection.trim() || undefined,
        viewInfo: viewInfo.trim() || undefined,
        standingTip: standingTip.trim() || undefined,
        images: imagesChanged ? images : undefined,
      });
      onClose();
      if (!initial) reset();
      Alert.alert(successMessage);
    } catch (error) {
      Alert.alert('저장하지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <AppText weight="bold" size={18}>
              {title}
            </AppText>

            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n}점`}>
                  <SymbolView
                    name={{ ios: n <= rating ? 'star.fill' : 'star', android: n <= rating ? 'star' : 'star_border', web: n <= rating ? 'star' : 'star_border' }}
                    tintColor={n <= rating ? colors.star : colors.clearButton}
                    size={34}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={content}
              onChangeText={setContent}
              maxLength={CONTENT_MAX}
              multiline
              placeholder="공연장은 어땠나요? 다녀온 경험을 알려주세요"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.content]}
            />
            <View style={styles.photos}>
              {images.map((url) => (
                <View key={url}>
                  <Image source={{ uri: url }} style={styles.photo} contentFit="cover" />
                  <Pressable onPress={() => removePhoto(url)} style={styles.remove} hitSlop={8} accessibilityRole="button" accessibilityLabel="사진 빼기">
                    <AppText weight="bold" size={14} color={colors.white}>
                      ×
                    </AppText>
                  </Pressable>
                </View>
              ))}
              {images.length < PHOTO_MAX ? (
                <Pressable onPress={addPhotos} disabled={uploading} style={[styles.photo, styles.addPhoto]} accessibilityRole="button" accessibilityLabel="사진 추가">
                  <AppText weight="semibold" size={12} color={colors.textSecondary}>
                    {uploading ? '올리는 중' : `사진 ${images.length}/${PHOTO_MAX}`}
                  </AppText>
                </Pressable>
              ) : null}
            </View>
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={seatSection}
              onChangeText={setSeatSection}
              placeholder="좌석 구역 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
              value={viewInfo}
              onChangeText={setViewInfo}
              placeholder="시야 정보 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
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
                <Button title={submitLabel} onPress={submit} loading={pending} disabled={uploading} />
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
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.ms,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.text,
  },
  content: { minHeight: 120, textAlignVertical: 'top' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photo: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.surface },
  addPhoto: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  remove: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
