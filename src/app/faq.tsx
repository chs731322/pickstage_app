import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { FilterPill } from '@/components/FilterPill';
import { useFaqs } from '@/features/faqs';
import { cardShadow, colors, fontFamily, MAX_FONT_SCALE, radius, spacing } from '@/theme';

// 자주 묻는 질문: 분류로 거르고 검색할 수 있고, 질문을 누르면 답이 펼쳐진다.
export default function FaqScreen() {
  const headerHeight = useHeaderHeight();
  const { data, isPending, error, refetch, isRefetching } = useFaqs();
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs = data ?? [];
  const categories = [...new Set(faqs.map((f) => f.category).filter((c): c is string => Boolean(c)))];
  const query = keyword.trim().toLowerCase();
  const items = faqs.filter(
    (f) => (!category || f.category === category) && (!query || `${f.question} ${f.answer ?? ''}`.toLowerCase().includes(query)),
  );

  return (
    <ScrollView
      style={styles.list}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}
      refreshControl={<RefreshControl
          refreshing={isRefetching}
          onRefresh={() => {
            refetch();
          }}
        />}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}>
      <View style={styles.search}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={colors.textMuted} size={20} />
        <TextInput maxFontSizeMultiplier={MAX_FONT_SCALE}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="궁금한 내용을 검색해보세요"
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          returnKeyType="search"
          style={styles.searchInput}
        />
      </View>

      {categories.length > 0 ? (
        <View style={styles.pills}>
          <FilterPill label="전체" active={!category} onPress={() => setCategory('')} />
          {categories.map((c) => (
            <FilterPill key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>
      ) : null}

      {isPending ? (
        <ActivityIndicator color={colors.brand} style={styles.state} />
      ) : items.length === 0 ? (
        <EmptyState
          variant={error ? 'error' : 'empty'}
          title={error ? '불러오지 못했어요' : faqs.length > 0 ? '검색 결과가 없어요' : '등록된 질문이 없어요'}
          description={error ? '아래로 당겨서 다시 시도해보세요.' : faqs.length > 0 ? '다른 검색어나 분류로 다시 찾아보세요.' : undefined}
        />
      ) : (
        items.map((faq) => {
          const open = openId === faq.id;
          return (
            <Pressable
              key={faq.id}
              onPress={() => setOpenId(open ? null : faq.id)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}>
              <View style={styles.question}>
                <AppText weight="bold" size={16} color={colors.brand}>
                  Q
                </AppText>
                <View style={styles.flex}>
                  {faq.category ? (
                    <AppText weight="bold" size={12} color={colors.textMuted}>
                      {faq.category}
                    </AppText>
                  ) : null}
                  <AppText weight="bold" size={16} style={styles.line}>
                    {faq.question}
                  </AppText>
                </View>
                <SymbolView
                  name={{ ios: open ? 'chevron.up' : 'chevron.down', android: open ? 'expand_less' : 'expand_more', web: open ? 'expand_less' : 'expand_more' }}
                  tintColor={colors.textMuted}
                  size={18}
                />
              </View>
              {open ? (
                <AppText size={14} color={colors.textSecondary} style={styles.answer}>
                  {faq.answer ?? '답변을 불러오지 못했어요. 아래로 당겨서 다시 시도해보세요.'}
                </AppText>
              ) : null}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  list: { flex: 1, backgroundColor: colors.pageBg },
  content: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.white },
  searchInput: { flex: 1, fontFamily: fontFamily.regular, fontSize: 16, color: colors.text, paddingVertical: 0 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
  state: { marginTop: spacing.xl },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white, ...cardShadow },
  question: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  line: { lineHeight: 23 },
  answer: { lineHeight: 24, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
