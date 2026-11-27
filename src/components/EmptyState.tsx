import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, radius, spacing } from '@/theme';

const ART = {
  empty: require('../../assets/images/empty/ticket-empty.svg'),
  error: require('../../assets/images/empty/ticket-error.svg'),
};

type Props = {
  // empty: 보여줄 게 없을 때 (웃는 표), error: 불러오지 못했을 때 (우는 표)
  variant?: 'empty' | 'error';
  title: string;
  description?: string;
  // 아래 버튼 (예: 다시 시도, 글쓰기)
  actionLabel?: string;
  onAction?: () => void;
};

// 화면 가운데에 브랜드 캐릭터와 안내 문구를 보여준다. "아직 없어요", "불러오지 못했어요" 같은 빈 화면에 쓴다.
export function EmptyState({ variant = 'empty', title, description, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <Image source={ART[variant]} style={styles.art} contentFit="contain" accessibilityLabel="" />
      <AppText weight="bold" size={18} style={styles.center}>
        {title}
      </AppText>
      {description ? (
        <AppText size={14} color={colors.textSecondary} style={[styles.center, styles.description]}>
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [styles.action, pressed && styles.pressed]} accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.brandStrong}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
  art: { width: 200, height: 158 },
  center: { textAlign: 'center' },
  description: { lineHeight: 22 },
  action: { marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.ms, borderRadius: radius.pill, backgroundColor: colors.brandTint },
  pressed: { opacity: 0.7 },
});
