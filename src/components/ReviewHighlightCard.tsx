import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useReviewHighlights, type HighlightTarget } from '@/features/reviewHighlights';
import { colors, radius, spacing } from '@/theme';

const MAX_KEYWORDS = 10;
const SENTIMENT_LABEL: Record<string, string> = { positive: '긍정', negative: '부정', neutral: '중립' };
const EMPTY_MESSAGE = '아직 하이라이트를 만들 만큼 후기가 쌓이지 않았어요.';

type Props = {
  target: HighlightTarget;
  id: number;
  // 후기가 모자랄 때 보여줄 "후기 남기기" 버튼 (없으면 안 보인다)
  onWrite?: () => void;
};

// 후기를 AI가 요약한 키워드 카드 (공연·공연장 상세, 웹의 "후기 하이라이트"와 같은 내용)
export function ReviewHighlightCard({ target, id, onWrite }: Props) {
  const { data, isPending, isError } = useReviewHighlights(target, id);

  // 부가 정보라서, 불러오지 못하면 화면에서 뺀다
  if (isError) return null;

  const keywords = [...(data?.keywords ?? [])].sort((a, b) => b.count - a.count).slice(0, MAX_KEYWORDS);
  const subject = target === 'venue' ? '공연장' : '공연';
  const updated = data?.updatedAt ? data.updatedAt.slice(0, 10).replaceAll('-', '.') : '';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText weight="bold" size={18}>
          후기 하이라이트
        </AppText>
        <View style={styles.badge}>
          <AppText weight="bold" size={12} color={colors.brandStrong}>
            AI 분석
          </AppText>
        </View>
      </View>

      {isPending ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.brand} />
          <AppText size={14} color={colors.textMuted} style={styles.flex}>
            후기를 분석하고 있어요. 처음 한 번은 조금 걸릴 수 있어요.
          </AppText>
        </View>
      ) : keywords.length === 0 ? (
        <>
          <AppText size={14} color={colors.textMuted}>
            {data?.message || EMPTY_MESSAGE}
          </AppText>
          {onWrite ? (
            <Pressable onPress={onWrite} style={({ pressed }) => [styles.write, pressed && styles.writePressed]} accessibilityRole="button">
              <AppText weight="bold" size={14} color={colors.textSecondary}>
                공연 후기 남기기
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : (
        <>
          <View style={styles.chips}>
            {keywords.map((item) => {
              const sentiment = SENTIMENT_LABEL[item.sentiment] ? item.sentiment : 'neutral';
              return (
                <View
                  key={item.keyword}
                  style={[styles.chip, sentiment === 'positive' && styles.positive, sentiment === 'negative' && styles.negative]}>
                  <AppText weight="bold" size={14}>
                    {item.keyword}
                  </AppText>
                  <AppText size={13} color={sentiment === 'positive' ? colors.onBrandSoft : colors.textSecondary}>
                    {item.count}회
                  </AppText>
                  <AppText size={12} color={sentiment === 'positive' ? colors.brandStrong : colors.textMuted}>
                    {SENTIMENT_LABEL[sentiment]}
                  </AppText>
                </View>
              );
            })}
          </View>
          <AppText size={13} color={colors.textMuted}>
            {subject} 후기 {data?.reviewCount}건을 AI가 분석한 요약이에요{updated ? ` · ${updated} 기준` : ''}
          </AppText>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.card },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  badge: { paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brandTint },
  loading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    // 보통 의견은 선 없이, 긍정·부정만 선 색으로 구분한다
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
  },
  positive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  negative: { borderColor: colors.text, backgroundColor: colors.white },
  // 티켓 '더보기'와 같은 회색 버튼
  write: { alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: radius.pill, backgroundColor: colors.surface },
  writePressed: { opacity: 0.6 },
});
