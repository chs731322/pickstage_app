import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { FilterPill } from '@/components/FilterPill';
import { Screen } from '@/components/Screen';
import { POST_CATEGORY_LABEL, pickAndUploadImages, useCreatePost, usePost, useUpdatePost } from '@/features/community';
import { errorMessage } from '@/lib/api';
import {
  extractImageUrls,
  imageToken,
  POST_IMAGES_MAX_COUNT,
  POST_TEXT_MAX_LENGTH,
  textLength,
  TITLE_MAX_LENGTH,
} from '@/lib/postContent';
import { colors, fontFamily, radius, spacing } from '@/theme';

// 글쓰기·글 수정 (id가 있으면 수정). 사진은 본문에 `![사진](주소)` 줄로 들어간다.
export default function WriteScreen() {
  const { id, category: initialCategory } = useLocalSearchParams<{ id?: string; category?: string }>();
  const { data: existing } = usePost(id);
  // 수정할 글을 불러온 뒤에 입력칸을 채운다 (key로 다시 만든다)
  if (id && !existing) return <Screen topInset={false}><AppText color={colors.textMuted}>불러오는 중이에요...</AppText></Screen>;
  return (
    <WriteForm
      key={existing?.id ?? 'new'}
      editId={existing?.id}
      initial={{
        category: existing?.category ?? (initialCategory && POST_CATEGORY_LABEL[initialCategory] ? initialCategory : 'free'),
        title: existing?.title ?? '',
        content: existing?.content ?? '',
      }}
    />
  );
}

function WriteForm({ editId, initial }: { editId?: number; initial: { category: string; title: string; content: string } }) {
  const [category, setCategory] = useState(initial.category);
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [uploading, setUploading] = useState(false);
  const create = useCreatePost();
  const update = useUpdatePost(editId ?? 0);
  const pending = create.isPending || update.isPending;

  const addPhotos = async () => {
    const room = POST_IMAGES_MAX_COUNT - extractImageUrls(content).length;
    if (room <= 0) return Alert.alert(`사진은 최대 ${POST_IMAGES_MAX_COUNT}장까지 넣을 수 있어요.`);
    setUploading(true);
    try {
      const urls = await pickAndUploadImages(room);
      if (urls.length > 0) setContent((prev) => `${prev}${prev && !prev.endsWith('\n') ? '\n' : ''}${urls.map(imageToken).join('\n')}\n`);
    } catch (error) {
      Alert.alert('사진을 올리지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    if (!title.trim() || title.trim().length > TITLE_MAX_LENGTH) return Alert.alert(`제목은 1~${TITLE_MAX_LENGTH}자로 입력해주세요.`);
    if (!content.trim() || textLength(content) > POST_TEXT_MAX_LENGTH) return Alert.alert(`내용은 1~${POST_TEXT_MAX_LENGTH}자로 입력해주세요.`);
    const handlers = {
      onSuccess: () => router.back(),
      onError: (e: unknown) => Alert.alert('저장하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
    };
    const input = { category, title: title.trim(), content: content.trim() };
    if (editId) update.mutate(input, handlers);
    else create.mutate(input, handlers);
  };

  return (
    <Screen topInset={false} keyboard tone="page">
      <View style={styles.pills}>
        {Object.entries(POST_CATEGORY_LABEL).map(([value, label]) => (
          <FilterPill key={value} label={label} active={category === value} onPress={() => setCategory(value)} />
        ))}
      </View>
      <TextInput value={title} onChangeText={setTitle} placeholder="제목" placeholderTextColor={colors.textMuted} maxLength={TITLE_MAX_LENGTH} style={styles.title} />
      <TextInput value={content} onChangeText={setContent} placeholder="내용을 입력해주세요" placeholderTextColor={colors.textMuted} multiline style={styles.content} />
      <Pressable onPress={addPhotos} disabled={uploading} style={styles.photo} accessibilityRole="button">
        <AppText weight="semibold" size={15} color={colors.textSecondary}>
          {uploading ? '사진 올리는 중...' : `사진 추가 (${extractImageUrls(content).length}/${POST_IMAGES_MAX_COUNT})`}
        </AppText>
      </Pressable>
      <AppText size={13} color={colors.textMuted}>
        욕설·비하 등 커뮤니티 이용 규칙에 어긋나는 내용은 등록이 제한될 수 있어요.
      </AppText>
      <Button title={editId ? '수정하기' : '등록하기'} onPress={submit} loading={pending} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  title: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, fontFamily: fontFamily.bold, fontSize: 18, color: colors.text },
  content: { minHeight: 240, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, textAlignVertical: 'top' },
  photo: { alignItems: 'center', paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
});
