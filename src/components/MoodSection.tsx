import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { FilterPill } from '@/components/FilterPill';
import { PosterCard } from '@/components/PosterCard';
import { SectionHeader } from '@/components/SectionHeader';
import { MOOD_TABS, useMoodFestivals, type MoodId } from '@/features/festivals';
import { colors, spacing } from '@/theme';

// "이런 공연 어때요?": 기분에 맞는 탭(혼자 즐기기 / 야외에서 낭만 있게 / 뛰어보자)을 고르면 그에 맞는 공연이 가로로 나온다
export function MoodSection() {
  const [mood, setMood] = useState<MoodId>(MOOD_TABS[0].id);
  const { data, isPending } = useMoodFestivals(mood);

  return (
    <View style={styles.section}>
      <SectionHeader title="이런 공연 어때요?" eyebrow="FOR YOU" highlight="이런 공연" icon={require('../../assets/images/decor/burst-pink.webp')} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
        style={styles.pillsScroll}>
        {MOOD_TABS.map((tab) => (
          <FilterPill key={tab.id} label={tab.label} active={tab.id === mood} onPress={() => setMood(tab.id)} />
        ))}
      </ScrollView>

      {isPending ? (
        <ActivityIndicator color={colors.brand} style={styles.loading} />
      ) : data && data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PosterCard festival={item} />}
        />
      ) : (
        <AppText color={colors.textMuted} style={styles.empty}>
          지금 보여드릴 공연이 없어요. 다른 기분을 골라보세요.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  pillsScroll: { flexGrow: 0 },
  pills: { gap: spacing.sm, paddingHorizontal: spacing.md },
  list: { gap: spacing.md, paddingHorizontal: spacing.md },
  loading: { marginVertical: spacing.xl },
  empty: { paddingHorizontal: spacing.md, paddingVertical: spacing.lg },
});
