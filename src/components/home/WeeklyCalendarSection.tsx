import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { CalendarEventRow } from '@/components/CalendarEventRow';
import { SectionHeader } from '@/components/SectionHeader';
import { useCalendarFestivals } from '@/features/calendar';
import { buildLayout, toDateStr, type CalendarFestival } from '@/lib/calendar';
import { cardShadow, colors, spacing } from '@/theme';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const MAX_EVENTS = 3;

function mondayOf(base: Date, offsetWeeks: number): Date {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offsetWeeks * 7);
  return d;
}

// 홈의 "주간 공연 캘린더": 이번 주 7일을 한 줄로 보여주고, 고른 날에 열리는 공연을 아래에 보여준다 (웹과 같은 구성)
export function WeeklyCalendarSection() {
  const today = useMemo(() => new Date(), []);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(todayStr);

  const monday = mondayOf(today, weekOffset);
  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
        return { date: d, dateStr: toDateStr(d.getFullYear(), d.getMonth(), d.getDate()), num: d.getDate() };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weekOffset],
  );

  // 한 주가 두 달에 걸칠 수 있어서, 월요일과 일요일이 속한 달을 모두 불러온다
  const first = days[0].date;
  const last = days[6].date;
  const a = useCalendarFestivals(first.getFullYear(), first.getMonth() + 1);
  const b = useCalendarFestivals(last.getFullYear(), last.getMonth() + 1);
  const festivals = useMemo(() => {
    const byId = new Map<number, CalendarFestival>();
    [...(a.data ?? []), ...(b.data ?? [])].forEach((f) => byId.set(f.id, f));
    return [...byId.values()];
  }, [a.data, b.data]);
  const { colorById } = useMemo(() => buildLayout(festivals), [festivals]);

  const eventsOf = (dateStr: string) => festivals.filter((f) => f.startDate <= dateStr && dateStr <= f.endDate);
  const selectedDay = days.find((d) => d.dateStr === selected) ?? days[0];
  const events = eventsOf(selectedDay.dateStr);
  const loading = a.isPending || b.isPending;

  const moveWeek = (offset: number) => {
    const next = weekOffset + offset;
    setWeekOffset(next);
    // 이번 주로 돌아오면 오늘, 아니면 그 주 월요일을 고른다
    const m = mondayOf(today, next);
    setSelected(next === 0 ? todayStr : toDateStr(m.getFullYear(), m.getMonth(), m.getDate()));
  };

  // 목요일이 속한 달의 몇째 주인지 (웹과 같은 표기: 2026.11 3주차)
  const thursday = days[3].date;
  const weekLabel = `${thursday.getFullYear()}.${String(thursday.getMonth() + 1).padStart(2, '0')} ${Math.ceil(thursday.getDate() / 7)}주차`;

  return (
    <View style={styles.section}>
      <SectionHeader title="주간 공연 캘린더" eyebrow="THIS WEEK" highlight="주간" highlightColor={colors.white} onPressMore={() => router.push('/calendar')} />

      <View style={styles.card}>
        <View style={styles.weekRow}>
          <Pressable onPress={() => moveWeek(-1)} hitSlop={12} accessibilityLabel="이전 주">
            <AppText size={24} weight="bold">
              ‹
            </AppText>
          </Pressable>
          <AppText weight="bold" size={16}>
            {weekLabel}
          </AppText>
          <Pressable onPress={() => moveWeek(1)} hitSlop={12} accessibilityLabel="다음 주">
            <AppText size={24} weight="bold">
              ›
            </AppText>
          </Pressable>
        </View>

        <View style={styles.days}>
          {days.map((d, i) => {
            const isSelected = d.dateStr === selectedDay.dateStr;
            const isToday = d.dateStr === todayStr;
            const count = eventsOf(d.dateStr).length;
            return (
              <Pressable
                key={d.dateStr}
                onPress={() => setSelected(d.dateStr)}
                style={styles.day}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${d.date.getMonth() + 1}월 ${d.num}일, 공연 ${count}개`}>
                <AppText size={12} weight="medium" color={i === 6 ? colors.danger : i === 5 ? '#3b6fd4' : colors.textMuted}>
                  {WEEKDAYS[i]}
                </AppText>
                <View style={[styles.num, isSelected && styles.numSelected, !isSelected && isToday && styles.numToday]}>
                  <AppText weight="bold" size={15} color={isSelected ? colors.white : isToday ? colors.brand : colors.text}>
                    {d.num}
                  </AppText>
                </View>
                <View style={[styles.dot, count > 0 && styles.dotOn]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.events}>
        {loading ? null : events.length === 0 ? (
          <AppText color={colors.textMuted} size={15} style={styles.empty}>
            이 날에는 아직 등록된 공연이 없어요. 다른 날도 확인해보세요.
          </AppText>
        ) : (
          <>
            {events.slice(0, MAX_EVENTS).map((f) => (
              <CalendarEventRow key={f.id} festival={f} color={colorById[f.id]?.[0]} />
            ))}
            {events.length > MAX_EVENTS ? (
              <Pressable onPress={() => router.push('/calendar')} style={styles.more} accessibilityRole="button">
                <AppText weight="bold" size={14} color={colors.textSecondary}>
                  캘린더에서 {events.length - MAX_EVENTS}개 더 보기
                </AppText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  card: { marginHorizontal: spacing.md, padding: spacing.md, borderRadius: 22, backgroundColor: colors.white, gap: spacing.sm, ...cardShadow },
  weekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  days: { flexDirection: 'row' },
  day: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  num: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  numSelected: { backgroundColor: colors.brand },
  numToday: { borderWidth: 1.5, borderColor: colors.brand },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: colors.brand },
  events: { gap: spacing.sm, paddingHorizontal: spacing.md },
  empty: { paddingVertical: spacing.sm },
  more: { alignItems: 'center', paddingVertical: 12, borderRadius: 14, backgroundColor: colors.surface },
});
