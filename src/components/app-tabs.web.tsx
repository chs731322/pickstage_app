import { Tabs } from 'expo-router';

import { colors, fontFamily } from '@/theme';

// 웹 미리보기용 하단 탭 (개발 중 컴퓨터 브라우저에서 화면을 확인할 때만 쓴다). 폰은 app-tabs.tsx.
export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarLabelStyle: { fontFamily: fontFamily.medium },
      }}>
      <Tabs.Screen name="index" options={{ title: '홈' }} />
      <Tabs.Screen name="performances" options={{ title: '공연' }} />
      <Tabs.Screen name="calendar" options={{ title: '캘린더' }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티' }} />
      <Tabs.Screen name="me" options={{ title: '마이' }} />
    </Tabs>
  );
}
