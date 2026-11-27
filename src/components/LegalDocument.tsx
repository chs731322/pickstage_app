import { useHeaderHeight } from 'expo-router/react-navigation';
import { Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { LegalDoc, Span } from '@/content/legal';
import { colors, radius, spacing } from '@/theme';

const EMAIL = /([\w.+-]+@[\w-]+\.[\w.]*\w)/;

// 이용약관·개인정보처리방침 본문. 표는 좁은 화면에 맞게 한 줄을 카드 하나로 보여준다.
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  const headerHeight = useHeaderHeight();
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: spacing.md + (Platform.OS === 'ios' ? headerHeight : 0) }]}>
      <AppText size={13} color={colors.textMuted}>
        {doc.updated}
      </AppText>
      {doc.notice ? (
        <View style={styles.box}>
          <Paragraph spans={doc.notice} />
        </View>
      ) : null}
      {doc.blocks.map((block, i) => {
        if (block.type === 'ul') {
          return (
            <View key={i} style={styles.list}>
              {block.items.map((spans, j) => (
                <View key={j} style={styles.item}>
                  <AppText color={colors.textMuted} style={styles.line}>
                    •
                  </AppText>
                  <View style={styles.flex}>
                    <Paragraph spans={spans} />
                  </View>
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'table') {
          return (
            <View key={i} style={styles.list}>
              {block.rows.map((row, j) => (
                <View key={j} style={styles.box}>
                  {row.map((cell, k) => (
                    <View key={k}>
                      <AppText weight="bold" size={12} color={colors.textMuted}>
                        {block.head[k]}
                      </AppText>
                      <AppText weight={k === 0 ? 'bold' : 'regular'} style={styles.line} selectable>
                        {cell}
                      </AppText>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'h2' || block.type === 'h3') {
          return (
            <AppText key={i} weight="bold" size={block.type === 'h2' ? 18 : 16} style={styles.heading} accessibilityRole="header">
              {block.spans.map((s) => s.text).join('')}
            </AppText>
          );
        }
        return <Paragraph key={i} spans={block.spans} />;
      })}
    </ScrollView>
  );
}

// 문단 하나. 굵은 부분은 굵게, 이메일 주소는 누르면 메일 앱이 열린다.
function Paragraph({ spans }: { spans: Span[] }) {
  return (
    <AppText color={colors.textSecondary} style={styles.line} selectable>
      {spans.map((span, i) => (
        <AppText key={i} weight={span.bold ? 'bold' : 'regular'} color={span.bold ? colors.text : colors.textSecondary}>
          {span.text.split(EMAIL).map((part, j) =>
            j % 2 === 1 ? (
              <AppText key={j} color={colors.brandStrong} onPress={() => Linking.openURL(`mailto:${part}`)}>
                {part}
              </AppText>
            ) : (
              part
            ),
          )}
        </AppText>
      ))}
    </AppText>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.pageBg },
  content: { gap: spacing.ms, paddingHorizontal: spacing.md, paddingBottom: spacing.xl * 2 },
  heading: { marginTop: spacing.ms },
  line: { lineHeight: 22 },
  list: { gap: spacing.sm },
  item: { flexDirection: 'row', gap: spacing.sm },
  box: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white },
});
