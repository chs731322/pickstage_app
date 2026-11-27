import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FestivalDetail } from '@/features/festivals';
import { formatDateRange, formatOpenAt } from '@/lib/format';
import { brandScale, cardShadow, colors, radius, spacing } from '@/theme';

type Props = {
  festival: FestivalDetail;
  // 공연 상태 표시 (D-5, 진행 중, 종료)
  status: { kind: string; label: string } | null;
  genre: string | null;
  // 티켓 가로 길이
  width: number;
};

const NOTCH = 26;
const DOT_COUNT = 36;

// 공연 상세 맨 위의 세로 티켓: 위는 포스터, 가운데에 점선과 양쪽 홈(뜯는 선), 아래는 제목과 날짜·지역·장소·티켓 오픈 정보
export function ConcertTicket({ festival, status, genre, width }: Props) {
  // 포스터가 잘리지 않게, 불러온 사진의 가로세로 비율대로 높이를 정한다 (너무 길거나 납작한 사진은 한도 안에서 줄이고, 남는 곳은 흐린 배경으로 채운다)
  const [ratio, setRatio] = useState(4 / 3);
  const posterHeight = Math.round(width * Math.min(Math.max(ratio, 0.7), 1.7));
  const venue = festival.venue;
  const isEnded = status?.kind === 'ended';
  const subtitle = [genre, festival.region].filter(Boolean).join(' · ');

  return (
    <View style={[styles.shadow, { width }]}>
      <View style={styles.ticket}>
        {/* 포스터 */}
        <View style={{ height: posterHeight, backgroundColor: colors.surface }}>
          {festival.posterImage ? (
            <>
              <Image source={{ uri: festival.posterImage }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={40} />
              <Image
                source={{ uri: festival.posterImage }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                transition={150}
                onLoad={(event) => {
                  const { width: w, height: h } = event.source;
                  if (w > 0 && h > 0) setRatio(h / w);
                }}
              />
            </>
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.noPoster]}>
              <AppText color={colors.textMuted}>포스터 준비 중</AppText>
            </View>
          )}
          {status ? (
            <View style={[styles.status, isEnded && styles.statusEnded, status.kind === 'live' && styles.statusLive]}>
              <AppText weight="bold" size={13} color={colors.white}>
                {status.label}
              </AppText>
            </View>
          ) : null}
        </View>

        {/* 정보 */}
        <View style={styles.panel}>
          {/* 포스터를 아주 흐리게 깔아서 포스터의 색이 그대로 분위기가 되게 하고, 어둡게 눌러서 흰 글씨가 읽히게 한다 */}
          {festival.posterImage ? (
            <Image source={{ uri: festival.posterImage }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={90} />
          ) : null}
          <View style={[StyleSheet.absoluteFill, festival.posterImage ? styles.shade : styles.shadeNoPoster]} />
          {isEnded ? <View style={[StyleSheet.absoluteFill, styles.endedShade]} /> : null}

          <AppText weight="bold" size={22} color={colors.white} style={styles.title} numberOfLines={3}>
            {festival.title}
          </AppText>
          {subtitle ? (
            <AppText weight="medium" size={14} color="rgba(255,255,255,0.8)" style={styles.center}>
              {subtitle}
            </AppText>
          ) : null}

          <View style={styles.grid}>
            <Field label="DATE" value={formatDateRange(festival.startDate, festival.endDate)} flex={1.3} />
            <Field label="CITY" value={festival.region ?? '-'} flex={1} />
          </View>
          <View style={styles.grid}>
            <Field
              label="PLACE"
              value={venue?.name ?? '-'}
              flex={1.3}
              onPress={venue ? () => router.push(`/venue/${venue.id}`) : undefined}
            />
            <Field label="TICKET OPEN" value={festival.ticketOpenAt ? formatOpenAt(festival.ticketOpenAt) : '미정'} flex={1} />
          </View>

          <AppText weight="medium" size={12} color="rgba(255,255,255,0.6)" style={styles.number}>
            No. {String(festival.id).padStart(8, '0')}
          </AppText>
        </View>

        {/* 점선과 양쪽 홈 (포스터와 정보 사이) */}
        <View pointerEvents="none" style={[styles.dots, { top: posterHeight - 2 }]}>
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <View key={i} style={styles.dot} />
          ))}
        </View>
        <View pointerEvents="none" style={[styles.notch, { left: -NOTCH / 2, top: posterHeight - NOTCH / 2 }]} />
        <View pointerEvents="none" style={[styles.notch, { right: -NOTCH / 2, top: posterHeight - NOTCH / 2 }]} />
      </View>
    </View>
  );
}

function Field({ label, value, flex, onPress }: { label: string; value: string; flex: number; onPress?: () => void }) {
  const content = (
    <>
      <AppText weight="semibold" size={12} color="rgba(255,255,255,0.65)" style={styles.label}>
        {label}
      </AppText>
      <AppText weight="bold" size={14} color={colors.white} numberOfLines={2} style={onPress && styles.link}>
        {value}
        {onPress ? ' ›' : ''}
      </AppText>
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={[styles.field, { flex }]} accessibilityRole="link">
      {content}
    </Pressable>
  ) : (
    <View style={[styles.field, { flex }]}>{content}</View>
  );
}

const styles = StyleSheet.create({
  shadow: { alignSelf: 'center', borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  ticket: { borderRadius: radius.lg, overflow: 'hidden' },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  status: { position: 'absolute', top: 14, left: 14, paddingHorizontal: spacing.ms, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brand },
  statusEnded: { backgroundColor: colors.textMuted },
  statusLive: { backgroundColor: colors.text },
  panel: { gap: spacing.ms, paddingHorizontal: spacing.lg - 4, paddingTop: spacing.lg, paddingBottom: spacing.md, backgroundColor: brandScale[700], overflow: 'hidden' },
  shade: { backgroundColor: 'rgba(15,0,25,0.45)' },
  shadeNoPoster: { backgroundColor: 'rgba(15,0,25,0.1)' },
  endedShade: { backgroundColor: 'rgba(60,60,70,0.55)' },
  link: { textDecorationLine: 'underline' },
  title: { textAlign: 'center', lineHeight: 30 },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  field: { gap: spacing.xs },
  label: { letterSpacing: 1.2 },
  number: { textAlign: 'center', letterSpacing: 2, marginTop: spacing.xs },
  dots: { position: 'absolute', left: NOTCH, right: NOTCH, height: 4, flexDirection: 'row', justifyContent: 'space-between' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.white },
  notch: { position: 'absolute', width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: colors.pageBg },
});
