import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { colors, spacing } from '@/theme';

// 위쪽에 보이는 그라데이션 그림의 높이, 그리고 그 위로 흰 카드가 얼마나 겹쳐 올라오는지
const ART_HEIGHT = 340;
const ART_VISIBLE = 150; // 제목줄 아래에서 카드가 시작하기 전까지 보이는 그림 높이

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

// 로그인·회원가입처럼 "처음 만나는" 화면의 바탕: 파스텔 그라데이션 위에 둥근 흰 카드가 올라온 모양.
// 카드 안에서 내용이 길면 스크롤되고, 그림은 뒤에 고정되어 카드에 가려진다.
// (제목줄은 투명하게 두어서 그림 위에 뒤로 가기 버튼만 떠 있다: src/app/_layout.tsx 참고)
export function AuthLayout({ title, subtitle, children }: Props) {
  const headerHeight = useHeaderHeight();

  return (
    <View style={styles.root}>
      <Image source={require('../../assets/images/auth-header.png')} style={styles.art} resizeMode="cover" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={{ height: headerHeight + ART_VISIBLE }} />
          <View style={styles.sheet}>
            <View style={styles.intro}>
              <AppText weight="bold" size={22} style={styles.center}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText color={colors.textMuted} size={14} style={[styles.center, styles.subtitle]}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  art: { position: 'absolute', top: 0, left: 0, right: 0, height: ART_HEIGHT },
  scroll: { flexGrow: 1 },
  sheet: {
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: colors.background,
    // 카드 위쪽으로 은은한 그림자: 그림과 카드가 자연스럽게 분리돼 보이게
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  intro: { gap: spacing.sm, paddingBottom: spacing.sm },
  subtitle: { lineHeight: 21 },
  center: { textAlign: 'center' },
});
