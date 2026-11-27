import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

export type ListKind = 'festival' | 'artist' | 'venue';

const KINDS: { id: ListKind; label: string }[] = [
  { id: 'festival', label: '공연' },
  { id: 'artist', label: '아티스트' },
  { id: 'venue', label: '공연장' },
];

// 제목 "공연 ⌄ 목록": 누르면 아래에서 올라오는 창에서 어떤 목록을 볼지 고른다
export function ListSwitcher({ value, onChange }: { value: ListKind; onChange: (next: ListKind) => void }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const label = KINDS.find((kind) => kind.id === value)!.label;

  const choose = (next: ListKind) => {
    setOpen(false);
    onChange(next);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.title}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`${label} 목록. 눌러서 다른 목록 고르기`}>
        <AppText weight="bold" size={22}>
          {label}
        </AppText>
        <View style={styles.arrow}>
          <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} tintColor={colors.text} size={14} />
        </View>
        <AppText weight="bold" size={22}>
          목록
        </AppText>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="닫기" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
            <View style={styles.grabber} />
            {KINDS.map((kind) => {
              const selected = kind.id === value;
              return (
                <Pressable
                  key={kind.id}
                  onPress={() => choose(kind.id)}
                  style={[styles.row, selected && styles.rowSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <AppText weight={selected ? 'bold' : 'medium'} size={16}>
                    {kind.label}
                  </AppText>
                  {selected ? <SymbolView name={{ ios: 'checkmark', android: 'check', web: 'check' }} tintColor={colors.brand} size={18} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  arrow: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.card },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { gap: spacing.xs, paddingHorizontal: spacing.md, paddingTop: spacing.ms, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colors.white },
  grabber: { alignSelf: 'center', width: 40, height: 4, marginBottom: spacing.ms, borderRadius: radius.pill, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52, paddingHorizontal: spacing.md, borderRadius: radius.md },
  rowSelected: { backgroundColor: colors.surface },
});
