import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChecklistCheck } from '@/components/ChecklistCheck';
import { Screen } from '@/components/Screen';
import { WeatherCard } from '@/components/WeatherCard';
import {
  CHECKLIST_CONTENT_MAX,
  useAddChecklistItem,
  useChecklist,
  useDeleteChecklistItem,
  useRenameChecklistItem,
  useToggleChecklistItem,
  type ChecklistItem,
} from '@/features/checklist';
import { errorMessage } from '@/lib/api';
import { colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

// 준비 체크리스트: 공연 가기 전에 챙길 것을 체크하고, 내 준비물을 추가·수정·삭제한다
export default function ChecklistScreen() {
  const { data: items, isPending, error, refetch } = useChecklist();
  const toggle = useToggleChecklistItem();
  const add = useAddChecklistItem();
  const rename = useRenameChecklistItem();
  const remove = useDeleteChecklistItem();

  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const total = items?.length ?? 0;
  const done = items?.filter((i) => i.isChecked).length ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const fail = (title: string) => (e: unknown) => Alert.alert(title, errorMessage(e, '잠시 후 다시 시도해주세요.'));

  const handleAdd = () => {
    const content = newText.trim();
    if (!content) return;
    add.mutate(content, { onSuccess: () => setNewText(''), onError: fail('추가하지 못했어요') });
  };

  const commitEdit = (item: ChecklistItem) => {
    const content = editText.trim();
    setEditingId(null);
    if (!content || content === item.content) return;
    rename.mutate({ id: item.id, content }, { onError: fail('수정하지 못했어요') });
  };

  const confirmDelete = (item: ChecklistItem) =>
    Alert.alert('준비물을 삭제할까요?', item.content, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => remove.mutate(item.id, { onError: fail('삭제하지 못했어요') }) },
    ]);

  return (
    <Screen topInset={false} keyboard>
      {/* 공연 당일 날씨 (웹의 공연 준비 가이드처럼 체크리스트 위에 함께 보여준다) */}
      <WeatherCard />

      {/* 진행 상황 */}
      <View style={styles.progressCard}>
        <View style={styles.progressTop}>
          <AppText weight="bold" size={18}>
            준비 완료율
          </AppText>
          <AppText weight="bold" size={22} color={colors.brand}>
            {percent}%
          </AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${percent}%` }]} />
        </View>
        <AppText size={14} color={colors.textSecondary}>
          {total === 0 ? '준비물을 추가해보세요.' : percent === 100 ? '모두 챙겼어요! 즐거운 공연 되세요 🎉' : `${total}개 중 ${done}개를 챙겼어요.`}
        </AppText>
      </View>

      {/* 준비물 추가 */}
      <View style={styles.addRow}>
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={newText}
          onChangeText={setNewText}
          placeholder="준비물 추가 (예: 우비, 응원봉)"
          placeholderTextColor={colors.textMuted}
          maxLength={CHECKLIST_CONTENT_MAX}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
          style={styles.addInput}
        />
        <Pressable onPress={handleAdd} disabled={!newText.trim() || add.isPending} style={({ pressed }) => [styles.addButton, pressed && styles.addPressed, !newText.trim() && styles.disabled]} accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.white}>
            담기
          </AppText>
        </Pressable>
      </View>

      {/* 목록 */}
      {isPending ? (
        <ActivityIndicator color={colors.brand} style={styles.state} />
      ) : error ? (
        <Pressable onPress={() => refetch()}>
          <AppText color={colors.textMuted} size={16} style={styles.center}>
            체크리스트를 불러오지 못했어요. 눌러서 다시 시도해보세요.
          </AppText>
        </Pressable>
      ) : total === 0 ? (
        <AppText color={colors.textMuted} size={16} style={[styles.state, styles.center]}>
          아직 등록된 준비물이 없어요.
        </AppText>
      ) : (
        <View style={styles.list}>
          {items!.map((item) => (
            <View key={item.id} style={styles.row}>
              <ChecklistCheck checked={item.isChecked} label={`${item.content} 완료 표시`} onPress={() => toggle.mutate({ id: item.id, isChecked: !item.isChecked })} />
              {editingId === item.id ? (
                <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
                  value={editText}
                  onChangeText={setEditText}
                  autoFocus
                  maxLength={CHECKLIST_CONTENT_MAX}
                  returnKeyType="done"
                  onSubmitEditing={() => commitEdit(item)}
                  onBlur={() => commitEdit(item)}
                  style={styles.editInput}
                />
              ) : (
                <AppText size={16} style={[styles.label, item.isChecked && styles.doneText]} color={item.isChecked ? colors.textMuted : colors.text}>
                  {item.content}
                </AppText>
              )}
              <Pressable onPress={() => { setEditingId(item.id); setEditText(item.content); }} hitSlop={8} accessibilityLabel={`${item.content} 수정`}>
                <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={colors.textMuted} size={19} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} accessibilityLabel={`${item.content} 삭제`}>
                <SymbolView name={{ ios: 'trash', android: 'delete', web: 'delete' }} tintColor={colors.danger} size={19} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressCard: { gap: spacing.ms, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 10, borderRadius: radius.pill, backgroundColor: colors.surface, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: colors.brand },
  addRow: { flexDirection: 'row', gap: spacing.sm },
  addInput: { flex: 1, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text },
  addButton: { minHeight: 48, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  addPressed: { backgroundColor: colors.brandStrong },
  disabled: { opacity: 0.4 },
  list: { borderRadius: radius.lg, backgroundColor: colors.white, paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1, lineHeight: 24 },
  doneText: { textDecorationLine: 'line-through' },
  editInput: { flex: 1, paddingVertical: spacing.xs, borderBottomWidth: 1.5, borderBottomColor: colors.brand, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text },
  state: { marginTop: spacing.lg },
  center: { textAlign: 'center' },
});
