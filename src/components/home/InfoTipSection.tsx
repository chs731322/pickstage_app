import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Highlight } from '@/components/Highlight';
import { cardShadow, colors, radius, spacing } from '@/theme';

// 웹 메인의 "DID YOU KNOW?" 공연 준비 팁 (웹 data/mainPageContent.js 와 같은 내용을 자리별로 나눠 보여준다)
const TIP = {
  label: 'DID YOU KNOW?',
  title: '페스티벌에서 ',
  titleHighlight: "'명당'",
  titleEnd: '은 어디일까요?',
  question: '무조건 앞자리일까요?',
  answer: 'NO!',
  closing: '내 취향에 맞는 나만의 명당을 찾아보세요!',
};

const SPOTS = [
  {
    place: '뒤쪽',
    note: '무대 전체를 한눈에 보고 싶다면',
    icon: { ios: 'eye', android: 'visibility', web: 'visibility' },
  },
  {
    place: '앞쪽',
    note: '생생한 현장감을 느끼고 싶다면',
    icon: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
  },
  {
    place: '통로 근처',
    note: '편하게 즐기고 싶다면',
    icon: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  },
] as const;

export function InfoTipSection() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <View style={styles.label}>
          <AppText weight="extrabold" size={12} color={colors.brand}>
            {TIP.label}
          </AppText>
        </View>

        <AppText weight="extrabold" size={22} style={styles.title}>
          {TIP.title}
          <Highlight>{TIP.titleHighlight}</Highlight>
          {TIP.titleEnd}
        </AppText>

        <View style={styles.answerRow}>
          <AppText size={16} color={colors.textSecondary} style={styles.question}>
            {TIP.question}
          </AppText>
          <AppText weight="extrabold" size={36} color={colors.brand} style={styles.answer}>
            {TIP.answer}
          </AppText>
        </View>

        <View style={styles.spots}>
          {SPOTS.map((spot) => (
            <View key={spot.place} style={styles.spot}>
              <View style={styles.spotIcon}>
                <SymbolView name={spot.icon as never} tintColor={colors.brand} size={20} />
              </View>
              <View style={styles.spotText}>
                <AppText weight="extrabold" size={16}>
                  {spot.place}
                </AppText>
                <AppText size={14} color={colors.textSecondary}>
                  {spot.note}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <AppText weight="bold" size={15} color={colors.brand} style={styles.closing}>
          {TIP.closing}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md },
  card: { gap: spacing.sm + 2, padding: spacing.lg - 4, borderRadius: 22, backgroundColor: colors.white, ...cardShadow },
  label: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  title: { lineHeight: 30, marginTop: 2 },
  answerRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  question: { flexShrink: 1 },
  answer: { lineHeight: 42 },
  spots: { gap: 10, marginTop: 2 },
  spot: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 16, backgroundColor: colors.pageBg },
  spotIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  spotText: { flex: 1, gap: 2 },
  closing: { marginTop: 2 },
});
