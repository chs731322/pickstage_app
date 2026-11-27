import { useHeaderHeight } from 'expo-router/react-navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { AuthCollage } from '@/components/AuthCollage';
import { colors, spacing } from '@/theme';

type Props = {
  title: [string, string];
  subtitle?: string;
  compact?: boolean;
  // 키보드가 올라오면 콜라주를 접는다 (입력칸이 적어 한 화면에 들어가는 로그인에서만 쓴다.
  // 긴 화면에서 접으면 보고 있던 칸이 위로 밀려난다)
  collapseOnKeyboard?: boolean;
  children: ReactNode;
};

// 로그인·회원가입·비밀번호 찾기의 바탕: 위에 스티커 콜라주, 아래에 입력칸. 세 화면이 같은 모양을 갖는다.
export function AuthCollageLayout({ title, subtitle, compact = false, collapseOnKeyboard = false, children }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const keyboard = useKeyboardVisible();
  const hidden = collapseOnKeyboard && keyboard;
  // 투명한 제목줄의 뒤로 가기 버튼이 콜라주 조각과 겹치지 않게 그만큼만 내린다
  const top = Platform.OS === 'web' ? 0 : Math.max(0, headerHeight - (compact ? 40 : 70));

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg, paddingTop: hidden ? headerHeight + spacing.md : 0 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {hidden ? null : (
          <View style={{ paddingTop: top }}>
            <AuthCollage width={width} title={title} compact={compact} />
          </View>
        )}
        <View style={styles.form}>
          {subtitle ? (
            <AppText size={14} color={colors.textSecondary} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const styles = StyleSheet.create({
  // 스티커가 돋보이는 아주 옅은 바탕
  screen: { flex: 1, backgroundColor: colors.pageBg },
  form: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { textAlign: 'center', paddingBottom: spacing.sm },
});
