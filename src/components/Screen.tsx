import { useHeaderHeight } from 'expo-router/react-navigation';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  // 스크롤이 필요 없는 화면(목록이 스스로 스크롤하는 경우)은 false
  scroll?: boolean;
  // 위쪽 안전 영역(노치)을 피할지. 탭 화면은 true(기본), 위에 화면 제목줄(헤더)이 있는 스택 화면은 false
  topInset?: boolean;
  // 입력칸이 있는 화면: 키보드가 올라와도 가려지지 않게 하고, 키보드 바깥을 눌러도 버튼이 눌리게 한다
  keyboard?: boolean;
};

// 모든 화면의 바탕. 화면의 종류에 따라 위쪽을 피하는 방법이 다르다.
export function Screen({ topInset = true, ...props }: Props) {
  return topInset ? (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Body {...props} topPadding={0} />
    </SafeAreaView>
  ) : (
    <HeaderScreen {...props} />
  );
}

// 제목줄(헤더)이 있는 화면. iOS의 제목줄은 반투명이라 내용 위에 "떠" 있고 내용을 자동으로 비켜주지 않는다.
// 그래서 제목줄 높이만큼 위쪽 여백을 직접 줘서, 화면 맨 위 글자가 제목줄 뒤에 가려지지 않게 한다.
// (src/app/_layout.tsx 에서 iOS만 headerTransparent로 설정했다. 안드로이드·웹은 제목줄이 내용을 밀어내므로 여백이 필요 없다.)
function HeaderScreen(props: Omit<Props, 'topInset'>) {
  const headerHeight = useHeaderHeight();
  return (
    <View style={styles.safe}>
      <Body {...props} topPadding={Platform.OS === 'ios' ? headerHeight : 0} />
    </View>
  );
}

function Body({
  children,
  scroll = true,
  keyboard = false,
  topPadding,
}: Omit<Props, 'topInset'> & { topPadding: number }) {
  const contentStyle = [styles.content, { paddingTop: spacing.md + topPadding }];

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboard ? 'handled' : 'never'}>
      {children}
    </ScrollView>
  ) : (
    <View style={contentStyle}>{children}</View>
  );

  return keyboard ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {body}
    </KeyboardAvoidingView>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
});
