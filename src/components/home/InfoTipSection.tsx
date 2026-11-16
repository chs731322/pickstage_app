import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

// 웹 메인의 "DID YOU KNOW?" 공연 준비 팁 (웹 data/mainPageContent.js 와 같은 내용)
const TIP = {
  label: 'DID YOU KNOW?',
  title: "Q. 페스티벌에서 '명당'은 어디일까요?",
  question: '무조건 앞자리일까요?',
  answer: 'NO!',
  body: '무대 전체를 한눈에 보고 싶다면 뒤쪽, 생생한 현장감을 느끼고 싶다면 앞쪽, 편하게 즐기고 싶다면 통로 근처!',
  closing: '내 취향에 맞는 나만의 명당을 찾아보세요!',
};

export function InfoTipSection() {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#1a0a14', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View style={styles.label}>
          <AppText weight="extrabold" size={12} color={colors.white}>
            {TIP.label}
          </AppText>
        </View>
        <AppText weight="extrabold" size={22} color={colors.white} style={styles.title}>
          {TIP.title}
        </AppText>
        <AppText size={16} color={colors.heroMuted}>
          {TIP.question}
        </AppText>
        <AppText weight="extrabold" size={44} color={colors.brand} style={styles.answer}>
          {TIP.answer}
        </AppText>
        <AppText size={16} color={colors.white} style={styles.body}>
          {TIP.body}
        </AppText>
        <AppText weight="bold" size={16} color="#ffd84d">
          {TIP.closing}
        </AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md },
  card: { gap: spacing.sm, padding: spacing.lg, borderRadius: 26 },
  label: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brand },
  title: { lineHeight: 30, marginTop: spacing.xs },
  answer: { lineHeight: 50 },
  body: { lineHeight: 25 },
});
