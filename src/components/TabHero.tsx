import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  // 제목 바로 옆에 붙는 작은 버튼 (예: 캘린더의 "오늘")
  action?: ReactNode;
  // 제목 아래에 놓는 것 (검색창 등)
  children?: ReactNode;
};

// 탭 화면 맨 위의 제목 영역: 제목과 소개 글, 그 아래에 검색창 같은 것을 놓는다
export function TabHero({ title, subtitle, action, children }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <AppText weight="bold" size={22}>
          {title}
        </AppText>
        {action}
      </View>
      {subtitle ? (
        <AppText weight="medium" size={14} color={colors.textSecondary}>
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
