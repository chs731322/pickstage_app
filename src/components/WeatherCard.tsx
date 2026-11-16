import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { api, errorMessage } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';
import type { ApiResponse, WeatherDay, WeatherSummary } from '@/types/api';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 'YYYY-MM-DD' -> '11.16(월)'
function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}(${weekday})`;
}

function temps(day: WeatherDay): string {
  return `${day.tempMax ?? '-'}° / ${day.tempMin ?? '-'}°`;
}

// 서울 날씨 (서버의 /api/weather/summary). 앱의 서버 연결이 잘 되는지 보여주는 첫 화면 조각이기도 하다.
export function WeatherCard() {
  const { data, isPending, error } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<WeatherSummary>>('/api/weather/summary', { timeout: 15000 });
      return res.data.data;
    },
    staleTime: 10 * 60_000,
  });

  return (
    <View style={styles.card}>
      <AppText weight="bold" size={16}>
        날씨 · 서울
      </AppText>

      {isPending && <ActivityIndicator color={colors.brand} style={styles.loading} />}
      {error && <AppText color={colors.textMuted}>{errorMessage(error, '날씨를 불러오지 못했어요.')}</AppText>}

      {data && (
        <>
          <View style={styles.today}>
            <View>
              <AppText color={colors.textSecondary} size={13}>
                {data.source === 'short' ? '오늘 ' : ''}
                {formatDay(data.date)}
              </AppText>
              <AppText weight="extrabold" size={22}>
                {data.sky ?? '날씨 정보 없음'}
              </AppText>
            </View>
            <AppText weight="bold" size={20} color={colors.brand}>
              {temps(data)}
            </AppText>
          </View>

          {data.upcoming.map((day) => (
            <View key={day.date} style={styles.row}>
              <AppText color={colors.textSecondary}>{formatDay(day.date)}</AppText>
              <AppText>{day.sky ?? '-'}</AppText>
              <AppText weight="medium">{temps(day)}</AppText>
            </View>
          ))}

          {data.isRain && (
            <AppText color={colors.brand} size={13} weight="medium">
              비나 눈 예보가 있어요. 우산이나 우비를 챙겨보세요.
            </AppText>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  loading: { alignSelf: 'flex-start', marginVertical: spacing.sm },
  today: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
});
