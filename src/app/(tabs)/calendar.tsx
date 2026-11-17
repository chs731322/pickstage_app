import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { CalendarEventRow } from '@/components/CalendarEventRow';
import { FilterPill } from '@/components/FilterPill';
import { TabHero } from '@/components/TabHero';
import { useCalendarFestivals } from '@/features/calendar';
import { buildLayout, buildWeeks, toDateStr } from '@/lib/calendar';
import { colors, radius, spacing } from '@/theme';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const REGIONS = ['전체', '서울', '인천', '경기', '부산', '강원'];
// 한 칸에 그릴 수 있는 일정 줄 수 (넘치면 "+n")
const MAX_BARS = 3;
const GRID_PADDING = spacing.md;

export default function CalendarScreen() {
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(toDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
  const [region, setRegion] = useState('전체');
  const { data, isPending, error } = useCalendarFestivals(cursor.year, cursor.month + 1);

  const festivals = useMemo(
    () => (data ?? []).filter((f) => region === '전체' || f.region === region),
    [data, region],
  );
  const weeks = useMemo(() => buildWeeks(cursor.year, cursor.month, festivals), [cursor, festivals]);
  const { slotById, colorById } = useMemo(() => buildLayout(festivals), [festivals]);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const cellWidth = (width - GRID_PADDING * 2) / 7;

  const selectedDay = weeks.flat().find((d) => d?.dateStr === selected) ?? null;
  const selectedFestivals = selectedDay?.festivals ?? [];

  const goToMonth = (offset: number) => {
    const next = new Date(cursor.year, cursor.month + offset, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
    // 이번 달로 돌아오면 오늘, 다른 달이면 1일을 고른다
    const isTodayMonth = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    setSelected(isTodayMonth ? todayStr : toDateStr(next.getFullYear(), next.getMonth(), 1));
  };

  const goToToday = () => {
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelected(todayStr);
  };

  const isTodayMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();
  const selectedDate = selectedDay ? new Date(cursor.year, cursor.month, selectedDay.day) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TabHero
          title="캘린더"
          subtitle="이번 달 공연을 한눈에 봐요"
          decor={require('../../../assets/images/decor/music-note.webp')}
          decorWidth={64}
          decorAspect={286 / 296}
          action={
            !isTodayMonth ? (
              <Pressable onPress={goToToday} hitSlop={8} style={styles.todayButton} accessibilityRole="button">
                <AppText weight="bold" size={14} color={colors.brand}>
                  오늘
                </AppText>
              </Pressable>
            ) : undefined
          }
          bleed={GRID_PADDING}
        />

        {/* 지역 */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll} contentContainerStyle={styles.pills}>
          {REGIONS.map((r) => (
            <FilterPill key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
          ))}
        </ScrollView>

        {/* 달 이동 */}
        <View style={styles.monthRow}>
          <Pressable onPress={() => goToMonth(-1)} hitSlop={12} accessibilityLabel="이전 달" style={styles.arrow}>
            <AppText size={24} weight="bold">
              ‹
            </AppText>
          </Pressable>
          <AppText weight="extrabold" size={22}>
            {cursor.year}년 {cursor.month + 1}월
          </AppText>
          <Pressable onPress={() => goToMonth(1)} hitSlop={12} accessibilityLabel="다음 달" style={styles.arrow}>
            <AppText size={24} weight="bold">
              ›
            </AppText>
          </Pressable>
        </View>

        {/* 달력 */}
        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <View key={w} style={{ width: cellWidth }}>
                <AppText
                  weight="semibold"
                  size={13}
                  color={i === 6 ? colors.danger : i === 5 ? '#3b6fd4' : colors.textMuted}
                  style={styles.center}>
                  {w}
                </AppText>
              </View>
            ))}
          </View>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={{ width: cellWidth, height: CELL_HEIGHT }} />;
                const isSelected = day.dateStr === selected;
                const isToday = day.dateStr === todayStr;
                // 줄 번호(slot) 순서대로 막대를 그린다 (며칠짜리 공연은 날짜가 바뀌어도 같은 줄)
                const bySlot = [...day.festivals].sort((a, b) => slotById[a.id] - slotById[b.id]);
                const bars = bySlot.slice(0, MAX_BARS);
                const hidden = bySlot.length - bars.length;
                return (
                  <Pressable
                    key={di}
                    onPress={() => setSelected(day.dateStr)}
                    style={[styles.cell, { width: cellWidth }, isSelected && styles.cellSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`${cursor.month + 1}월 ${day.day}일, 공연 ${day.festivals.length}개`}>
                    <View style={[styles.dayBadge, isToday && styles.dayBadgeToday]}>
                      <AppText
                        weight={isToday || isSelected ? 'bold' : 'medium'}
                        size={14}
                        color={isToday ? colors.white : di === 6 ? colors.danger : di === 5 ? '#3b6fd4' : colors.text}>
                        {day.day}
                      </AppText>
                    </View>
                    <View style={styles.bars}>
                      {bars.map((f) => (
                        <View key={f.id} style={[styles.bar, { backgroundColor: colorById[f.id][0] }]} />
                      ))}
                      {hidden > 0 ? (
                        <AppText size={10} weight="bold" color={colors.textMuted} style={styles.more}>
                          +{hidden}
                        </AppText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {isPending ? <ActivityIndicator color={colors.brand} style={styles.loading} /> : null}
        </View>

        {/* 고른 날의 공연 */}
        <View style={styles.listHeader}>
          <AppText weight="extrabold" size={20}>
            {selectedDate ? `${selectedDate.getMonth() + 1}월 ${selectedDate.getDate()}일 (${WEEKDAY_NAMES[selectedDate.getDay()]})` : ''}
          </AppText>
          {!isPending && !error ? (
            <AppText weight="bold" size={16} color={colors.brand}>
              {selectedFestivals.length}
            </AppText>
          ) : null}
        </View>

        {error ? (
          <AppText color={colors.textMuted} size={16}>
            캘린더를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </AppText>
        ) : !isPending && selectedFestivals.length === 0 ? (
          <AppText color={colors.textMuted} size={16}>
            이 날 열리는 공연이 없어요.
          </AppText>
        ) : (
          selectedFestivals.map((f) => <CalendarEventRow key={f.id} festival={f} color={colorById[f.id]?.[0]} />)
        )}

        {/* 이번 달 전체 개수 */}
        {!isPending && !error ? (
          <AppText size={13} color={colors.textMuted} style={styles.total}>
            {cursor.month + 1}월에는 공연 {festivals.length}개가 있어요.
          </AppText>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_HEIGHT = 62;

const styles = StyleSheet.create({
  // 위쪽 안전 영역은 하늘색 띠와 이어지게 하늘색, 내용은 연회색 바탕
  safe: { flex: 1, backgroundColor: colors.sky },
  scroll: { backgroundColor: colors.pageBg },
  content: { gap: spacing.md, padding: GRID_PADDING, paddingTop: 0, paddingBottom: spacing.xl },
  todayButton: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.white },
  // 알약 줄은 화면 양끝까지 스크롤되도록 안쪽 여백만큼 바깥으로 넓힌다
  pillsScroll: { marginHorizontal: -GRID_PADDING, flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: GRID_PADDING },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm },
  arrow: { paddingHorizontal: spacing.md },
  calendar: { borderRadius: 22, backgroundColor: colors.white, paddingVertical: spacing.sm },
  weekRow: { flexDirection: 'row' },
  center: { textAlign: 'center', paddingVertical: 6 },
  cell: { height: CELL_HEIGHT, alignItems: 'center', paddingTop: 4, borderRadius: 12 },
  cellSelected: { backgroundColor: colors.brandSoft },
  dayBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dayBadgeToday: { backgroundColor: colors.brand },
  bars: { alignSelf: 'stretch', gap: 2, marginTop: 4, paddingHorizontal: 3 },
  bar: { height: 5, borderRadius: 3 },
  more: { textAlign: 'center', lineHeight: 11 },
  loading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  total: { textAlign: 'center', marginTop: spacing.sm },
});
