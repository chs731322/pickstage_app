import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { WeatherTip } from '@/components/WeatherTip';
import { api, errorMessage } from '@/lib/api';
import { cardShadow, colors, radius, spacing } from '@/theme';
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
      <AppText weight="bold" size={18}>
        날씨 · 서울
      </AppText>

      {isPending && <ActivityIndicator color={colors.brand} style={styles.loading} />}
      {error && <AppText color={colors.textMuted}>{errorMessage(error, '날씨를 불러오지 못했어요.')}</AppText>}

      {data && (
        <>
          <View style={styles.today}>
            <View>
              <AppText color={colors.textSecondary} size={14}>
                {data.source === 'short' ? '오늘 ' : ''}
                {formatDay(data.date)}
              </AppText>
              <AppText weight="bold" size={22}>
                {data.sky ?? '날씨 정보 없음'}
              </AppText>
            </View>
            <AppText weight="bold" size={22} color={colors.brand}>
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

          <WeatherTip weather={data} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.ms,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    ...cardShadow,
  },
  loading: { alignSelf: 'flex-start', marginVertical: spacing.sm },
  today: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.ms,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
