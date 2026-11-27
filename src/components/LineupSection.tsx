import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { FilterPill } from '@/components/FilterPill';
import type { FestivalDetail } from '@/features/festivals';
import { colors, radius, spacing } from '@/theme';

type Artist = NonNullable<FestivalDetail['artists']>[number];
type Group = { key: string; label: string | null; artists: Artist[] };

const COLUMNS = 3;
const GAP = 12;
// 처음에 보여줄 팀 수 (3열 x 2줄)
const PREVIEW_COUNT = 6;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 'YYYY-MM-DD' -> '11월 20일 (금)'
function formatDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${m}월 ${d}일 (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
}

// 날짜가 있는 아티스트는 날짜별로 묶고(빠른 날짜부터), 날짜가 없으면 마지막에 둔다. (웹 라인업과 같은 규칙)
// 날짜가 있는 아티스트가 절반 미만이면(대부분 날짜 미정) 묶지 않고 한 목록으로 보여준다.
function groupByDate(artists: Artist[]): Group[] {
  const dated = artists.filter((a) => a.performanceDate).length;
  if (dated === 0 || dated / artists.length < 0.5) {
    return [{ key: 'all', label: null, artists }];
  }
  const byDate = new Map<string, Artist[]>();
  artists.forEach((artist) => {
    const key = artist.performanceDate ?? '';
    byDate.set(key, [...(byDate.get(key) ?? []), artist]);
  });
  return [...byDate.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([key, list]) => ({
      key: key || 'none',
      label: key ? formatDay(key) : '날짜 미정',
      // 헤드라이너를 먼저, 나머지는 원래 순서 유지
      artists: [...list].sort((x, y) => Number(y.isHeadliner) - Number(x.isHeadliner)),
    }));
}

// 라인업: 날짜가 여럿이면 날짜 탭으로 고르고, 3열 격자로 한눈에 보여준다 (넘기지 않고 "더보기"로 펼친다)
export function LineupSection({ artists, contentWidth }: { artists: Artist[]; contentWidth: number }) {
  const groups = groupByDate(artists);
  const hasTabs = Boolean(groups[0]?.label);
  const [day, setDay] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const activeDay = groups.some((g) => g.key === day) ? day : 'all';
  const visible = activeDay === 'all' ? groups : groups.filter((g) => g.key === activeDay);
  const totalCount = visible.reduce((sum, g) => sum + g.artists.length, 0);
  const canExpand = totalCount > PREVIEW_COUNT;

  // 접힌 상태에서는 앞에서부터 PREVIEW_COUNT팀까지만 보여준다 (날짜 묶음을 이어서 센다)
  const limit = expanded ? Infinity : PREVIEW_COUNT;
  const shownGroups = visible.map((group, index) => {
    const before = visible.slice(0, index).reduce((sum, g) => sum + g.artists.length, 0);
    return { group, shown: group.artists.slice(0, Math.max(0, limit - before)) };
  });
  const itemWidth = (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.wrap}>
      {hasTabs ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}>
          <FilterPill label="전체" active={activeDay === 'all'} onPress={() => setDay('all')} />
          {groups.map((g) => (
            <FilterPill key={g.key} label={g.label ?? ''} active={activeDay === g.key} onPress={() => setDay(g.key)} />
          ))}
        </ScrollView>
      ) : null}

      {shownGroups.map(({ group, shown }) => {
        if (shown.length === 0) return null;
        return (
          <View key={group.key} style={styles.group}>
            {group.label && activeDay === 'all' ? (
              <AppText weight="bold" size={14} color={colors.textSecondary}>
                {group.label}
              </AppText>
            ) : null}
            <View style={styles.grid}>
              {shown.map((artist) => (
                <Pressable
                  key={artist.id}
                  onPress={() => router.push(`/artist/${artist.id}`)}
                  style={{ width: itemWidth }}
                  accessibilityRole="button"
                  accessibilityLabel={`${artist.name} 아티스트 보기`}>
                  {artist.profileImage ? (
                    <Image
                      source={{ uri: artist.profileImage }}
                      style={[styles.avatar, { width: itemWidth, height: itemWidth, borderRadius: itemWidth / 2 }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.noImage, { width: itemWidth, height: itemWidth, borderRadius: itemWidth / 2 }]}>
                      <AppText weight="bold" size={22} color={colors.textMuted}>
                        {artist.name.slice(0, 1)}
                      </AppText>
                    </View>
                  )}
                  <AppText
                    weight={artist.isHeadliner ? 'extrabold' : 'semibold'}
                    size={14}
                    numberOfLines={2}
                    style={styles.name}>
                    {artist.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}

      {canExpand ? (
        <Pressable onPress={() => setExpanded((v) => !v)} style={styles.more} accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.textSecondary}>
            {expanded ? '접기' : `더보기 (${totalCount - PREVIEW_COUNT}팀)`}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  // 카드 안쪽 여백만큼 바깥으로 넓혀서 탭이 카드 끝까지 스크롤되게 한다
  tabsScroll: { marginHorizontal: -(spacing.md), flexGrow: 0 },
  tabs: { gap: spacing.sm, paddingHorizontal: spacing.md },
  group: { gap: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: GAP, rowGap: spacing.md },
  avatar: { backgroundColor: colors.surface },
  noImage: { alignItems: 'center', justifyContent: 'center' },
  name: { textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  more: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
});
