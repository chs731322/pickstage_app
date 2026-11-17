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
import { colors, spacing } from '@/theme';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  // 하늘색 물결 이미지(1920×200)를 화면 너비에 맞춘 높이. 모바일에서는 곡선이 너무 납작해 보이지 않게 조금 키운다
  const waveHeight = Math.round((width * 200) / 1920) * 1.6;
  const { data: tickets, isPending: ticketsPending } = useTicketOpenFestivals(6);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="never">
      <HeroSection />

      {/* 하늘색 물결 띠: 티켓 오픈 일정과 주간 캘린더가 이 안에 들어간다 (웹 메인과 같은 구성) */}
      <View style={styles.zone}>
        <Image source={require('../../../assets/images/decor/sky-wave-top.svg')} style={{ width, height: waveHeight }} contentFit="fill" />
        <View style={styles.zoneFill}>
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
        </View>
        <Image
          source={require('../../../assets/images/decor/sky-wave-bottom.svg')}
          style={{ width, height: waveHeight, marginTop: -1 }}
          contentFit="fill"
        />

        {/* 스티커: 핑크 별은 위쪽 왼쪽, "THIS WEEK'S PICK" 은 띠 아래쪽 오른쪽에 살짝 걸친다 */}
        <Image
          source={require('../../../assets/images/decor/burst-pink.webp')}
          style={[styles.burst, { top: waveHeight * 0.2 }]}
          contentFit="contain"
          pointerEvents="none"
        />
        <Image source={require('../../../assets/images/decor/sticker-pick.webp')} style={styles.sticker} contentFit="contain" pointerEvents="none" />
      </View>

      <View style={styles.body}>
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

const BURST_W = 64;
const STICKER_W = 150;

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingBottom: spacing.xl },
  zone: { position: 'relative' },
  // 물결 사이의 하늘색 면: 위아래 물결과 이어 붙는다
  zoneFill: { backgroundColor: colors.sky, marginTop: -1, gap: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm },
  burst: { position: 'absolute', left: -BURST_W * 0.4, width: BURST_W, height: (BURST_W * 1105) / 956 },
  sticker: { position: 'absolute', right: -STICKER_W * 0.28, bottom: -STICKER_W * 0.62, width: STICKER_W, height: STICKER_W },
  body: { gap: spacing.xl, paddingTop: spacing.xl },
  section: { gap: spacing.md },
  padded: { paddingHorizontal: spacing.md },
  hList: { gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: 4 },
  loading: { marginVertical: spacing.xl },
  empty: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
});
