import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ChecklistCheck } from '@/components/ChecklistCheck';
import { SectionHeader } from '@/components/SectionHeader';
import { WeatherCard } from '@/components/WeatherCard';
import { ESSENTIAL_ITEMS, useChecklist, useToggleChecklistItem } from '@/features/checklist';
import { useAuth } from '@/lib/auth';
import { cardShadow, colors, radius, spacing } from '@/theme';

const PREVIEW_SIZE = 5;

// 홈의 "공연 준비": 서울 날씨와 필수 지참 체크리스트. 로그인하면 내 체크리스트로 바뀌고 바로 체크할 수 있다.
export function PrepSection() {
  const { isLoggedIn } = useAuth();
  const { data } = useChecklist();
  const toggle = useToggleChecklistItem();
  const items = data?.slice(0, PREVIEW_SIZE) ?? [];
  const done = data?.filter((i) => i.isChecked).length ?? 0;

  return (
    <View style={styles.section}>
      <SectionHeader title="공연 준비" eyebrow="PREPARE" highlight="준비" />
      <View style={styles.padded}>
        <WeatherCard />
      </View>

      <View style={[styles.padded]}>
        <View style={styles.card}>
          <View style={styles.head}>
            <AppText weight="bold" size={18}>
              필수 지참 체크리스트
            </AppText>
            {isLoggedIn && data ? (
              <AppText weight="bold" size={14} color={colors.brand}>
                {done}/{data.length}
              </AppText>
            ) : null}
          </View>

          {isLoggedIn ? (
            items.length === 0 ? (
              <AppText color={colors.textMuted} size={14}>
                아직 등록된 준비물이 없어요.
              </AppText>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <ChecklistCheck
                    checked={item.isChecked}
                    label={`${item.content} 완료 표시`}
                    onPress={() => toggle.mutate({ id: item.id, isChecked: !item.isChecked })}
                  />
                  <AppText size={16} color={item.isChecked ? colors.textMuted : colors.text} style={[styles.label, item.isChecked && styles.done]}>
                    {item.content}
                  </AppText>
                </View>
              ))
            )
          ) : (
            ESSENTIAL_ITEMS.map((content) => (
              <View key={content} style={styles.row}>
                <ChecklistCheck checked={false} label={content} />
                <AppText size={16} style={styles.label}>
                  {content}
                </AppText>
              </View>
            ))
          )}

          <Pressable
            onPress={() => router.push(isLoggedIn ? '/checklist' : '/login')}
            style={styles.link}
            accessibilityRole="button">
            <AppText weight="bold" size={14} color={colors.brand}>
              {isLoggedIn ? '체크리스트 전체 보기 ›' : '로그인하고 내 체크리스트 만들기 ›'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  padded: { paddingHorizontal: spacing.md },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  label: { flex: 1, lineHeight: 22 },
  done: { textDecorationLine: 'line-through' },
  link: { alignItems: 'center', paddingTop: spacing.xs },
});
