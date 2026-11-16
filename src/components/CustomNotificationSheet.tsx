import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import {
  CUSTOM_NOTIFICATION_MAX,
  useCreateCustomNotification,
  useCustomNotifications,
  useDeleteCustomNotification,
} from '@/features/notifications';
import { errorMessage } from '@/lib/api';
import { colors, fontFamily, radius, spacing } from '@/theme';

const MEMO_MAX = 50;
const pad = (n: number) => String(n).padStart(2, '0');

// 서버가 받는 'YYYY-MM-DDTHH:mm'
const toServer = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const label = (v: string) => {
  const d = new Date(v);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 공연 시작일 기준으로 자주 쓰는 알림 시각 (이미 지난 시각은 뺀다. 웹과 같은 프리셋)
function buildPresets(startDate: string | null): { label: string; date: Date }[] {
  if (!startDate) return [];
  const [y, m, d] = startDate.slice(0, 10).split('-').map(Number);
  const now = new Date();
  const at = (daysBefore: number) => new Date(y, m - 1, d - daysBefore, 18, 0, 0, 0);
  return [
    { label: '공연 전날 저녁 6시', date: at(1) },
    { label: '공연 일주일 전 저녁 6시', date: at(7) },
  ].filter((p) => p.date > now);
}

type Props = { festivalId: number; startDate: string | null; visible: boolean; onClose: () => void };

// 공연 하나에 대해 받고 싶은 시각을 예약하는 창 (한 공연에 최대 3개). 예약한 시각에 푸시와 알림 목록으로 도착한다.
export function CustomNotificationSheet({ festivalId, startDate, visible, onClose }: Props) {
  const { data: items = [], isPending } = useCustomNotifications(festivalId, visible);
  const create = useCreateCustomNotification(festivalId);
  const remove = useDeleteCustomNotification(festivalId);
  const [memo, setMemo] = useState('');
  const presets = useMemo(() => buildPresets(startDate), [startDate]);
  const full = items.length >= CUSTOM_NOTIFICATION_MAX;
  const taken = new Set(items.map((i) => i.scheduledAt.slice(0, 16)));

  const reserve = (date: Date) =>
    create.mutate(
      { scheduledAt: toServer(date), message: memo.trim() || undefined },
      {
        onSuccess: () => setMemo(''),
        onError: (e) => Alert.alert('알림을 설정하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.')),
      },
    );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <AppText weight="extrabold" size={20}>
              알림 예약
            </AppText>
            <AppText size={14} color={colors.textSecondary}>
              원하는 시각에 이 공연 알림을 보내드려요. (최대 {CUSTOM_NOTIFICATION_MAX}개)
            </AppText>

            {/* 예약한 알림 */}
            {items.length > 0 ? (
              <View style={styles.group}>
                {items.map((item) => (
                  <View key={item.id} style={styles.item}>
                    <View style={styles.flex}>
                      <AppText weight="bold" size={16}>
                        {label(item.scheduledAt)}
                      </AppText>
                      {item.message ? (
                        <AppText size={13} color={colors.textSecondary}>
                          {item.message}
                        </AppText>
                      ) : null}
                    </View>
                    <Pressable
                      onPress={() => remove.mutate(item.id, { onError: (e) => Alert.alert('취소하지 못했어요', errorMessage(e)) })}
                      hitSlop={8}
                      accessibilityRole="button">
                      <AppText weight="semibold" size={14} color={colors.danger}>
                        취소
                      </AppText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : isPending ? null : (
              <AppText size={14} color={colors.textMuted}>
                아직 예약한 알림이 없어요.
              </AppText>
            )}

            {/* 새로 예약 */}
            <TextInput
              value={memo}
              onChangeText={setMemo}
              maxLength={MEMO_MAX}
              placeholder="알림에 같이 볼 메모 (선택)"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />
            {full ? (
              <AppText size={14} color={colors.textMuted}>
                예약은 한 공연에 {CUSTOM_NOTIFICATION_MAX}개까지예요. 하나를 취소하면 새로 예약할 수 있어요.
              </AppText>
            ) : presets.length === 0 ? (
              <AppText size={14} color={colors.textMuted}>
                {startDate ? '예약할 수 있는 시각이 지났어요.' : '공연 날짜가 정해지면 알림을 예약할 수 있어요.'}
              </AppText>
            ) : (
              presets.map((p) => (
                <Pressable
                  key={p.label}
                  onPress={() => reserve(p.date)}
                  disabled={create.isPending || taken.has(toServer(p.date))}
                  style={[styles.preset, taken.has(toServer(p.date)) && styles.presetTaken]}
                  accessibilityRole="button">
                  <AppText weight="semibold" size={16} color={taken.has(toServer(p.date)) ? colors.textMuted : colors.brand}>
                    {p.label}
                  </AppText>
                  <AppText size={13} color={colors.textMuted}>
                    {taken.has(toServer(p.date)) ? '이미 예약했어요' : label(toServer(p.date))}
                  </AppText>
                </Pressable>
              ))
            )}

            <Button title="닫기" variant="secondary" onPress={onClose} />
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
  sheet: { maxHeight: '88%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.white },
  body: { gap: spacing.sm + 2, padding: spacing.lg, paddingBottom: spacing.xl },
  group: { gap: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  input: { minHeight: 50, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text },
  preset: { gap: 2, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.brand },
  presetTaken: { borderColor: colors.border },
});
