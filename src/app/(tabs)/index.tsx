import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { HeroSection } from '@/components/HeroSection';
import { CommunitySection } from '@/components/home/CommunitySection';
import { InfoTipSection } from '@/components/home/InfoTipSection';
import { PrepSection } from '@/components/home/PrepSection';
import { RecommendedSection } from '@/components/home/RecommendedSection';
import { WeeklyCalendarSection } from '@/components/home/WeeklyCalendarSection';
import { MoodSection } from '@/components/MoodSection';
import { SectionHeader } from '@/components/SectionHeader';
import { TicketCard } from '@/components/TicketCard';
import { useTicketOpenFestivals } from '@/features/festivals';
import { useStatusBarStyle } from '@/lib/useStatusBarStyle';
import { colors, spacing } from '@/theme';

export default function HomeScreen() {
  // 맨 위가 검정이라 상태바 글자는 흰색
  useStatusBarStyle('light');
  const { width } = useWindowDimensions();
  const { data: tickets, isPending: ticketsPending } = useTicketOpenFestivals(6);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never">
      {/* 위로 더 끌어당겼을 때 하얀 빈칸이 보이지 않게 검정을 깔아둔다 */}
      <View style={styles.overscroll} />

      <HeroSection />

      {/* 검정 → 연회색 사이의 노란 물결 */}
      <Image
        source={require('../../../assets/images/decor/hero-wave.webp')}
        style={{ width, height: (width * 246) / 1948, marginTop: -1 }}
        contentFit="fill"
      />

      <View style={styles.body}>
        <View style={styles.section}>
          <SectionHeader title="티켓 오픈 일정" onPressMore={() => router.push('/performances')} />
          {ticketsPending ? (
            <ActivityIndicator color={colors.brand} style={styles.loading} />
          ) : tickets && tickets.length > 0 ? (
            <FlatList
              data={tickets}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item }) => <TicketCard festival={item} />}
            />
          ) : (
            <AppText color={colors.textMuted} style={styles.empty}>
              곧 열리는 티켓이 아직 없어요.
            </AppText>
          )}
        </View>

        <WeeklyCalendarSection />
        <RecommendedSection />
        <MoodSection />
        <InfoTipSection />
        <PrepSection />
        <CommunitySection />

        <Image
          source={require('../../../assets/images/decor/stage.webp')}
          style={{ width: width * 0.8, height: (width * 0.8 * 660) / 1618, alignSelf: 'center' }}
          contentFit="contain"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingBottom: spacing.xl },
  overscroll: { position: 'absolute', top: -1000, left: 0, right: 0, height: 1000, backgroundColor: '#000000' },
  body: { gap: spacing.xl, paddingTop: spacing.md },
  section: { gap: spacing.md },
  padded: { paddingHorizontal: spacing.md },
  hList: { gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 4 },
  loading: { marginVertical: spacing.xl },
  empty: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
});
