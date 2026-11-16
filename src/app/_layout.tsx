import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/queryClient';
import { PushRegistration } from '@/components/PushRegistration';
import { colors, fontFamily, fontFiles } from '@/theme';

// 글꼴과 로그인 정보를 다 불러올 때까지 스플래시 화면을 유지한다
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontFiles);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
        <PushRegistration />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// 로그인·회원가입 화면: 위쪽 그라데이션 그림 위에 뒤로 가기 버튼만 보이게 제목줄을 투명하고 제목 없이 둔다
const authScreenOptions = {
  title: '',
  headerTransparent: true,
  headerBlurEffect: 'none' as const,
  headerShadowVisible: false,
};

function RootNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fontFamily.bold },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
        // iOS: 제목줄을 흐림 효과가 있는 반투명으로 (내용은 Screen 컴포넌트가 제목줄 높이만큼 아래에서 시작한다)
        ...(Platform.OS === 'ios' ? { headerTransparent: true, headerBlurEffect: 'systemMaterial' as const } : {}),
      }}>
      {/* 탭 화면들 (헤더는 각 탭 화면이 직접 그린다) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* 로그인 없이도 볼 수 있는 상세 화면 (어느 탭에서든 위에 쌓인다) */}
      <Stack.Screen name="festival/[id]" options={{ title: '공연' }} />
      <Stack.Screen name="artist/[id]" options={{ title: '아티스트' }} />
      <Stack.Screen name="venue/[id]" options={{ title: '공연장' }} />
      <Stack.Screen name="user/[id]" options={{ title: '프로필' }} />
      <Stack.Screen name="community/[id]" options={{ title: '' }} />

      {/* 로그인한 사람만 (로그아웃 상태로 열면 로그인 화면으로 보낸다) */}
      <Stack.Protected guard={isLoggedIn} redirectTo="/login">
        <Stack.Screen name="notifications" options={{ title: '알림' }} />
        <Stack.Screen name="checklist" options={{ title: '준비 체크리스트' }} />
        <Stack.Screen name="push-settings" options={{ title: '푸시 알림 설정' }} />
        <Stack.Screen name="community/write" options={{ title: '글쓰기' }} />
        <Stack.Screen name="my/bookmarks" options={{ title: '찜한 공연' }} />
        <Stack.Screen name="my/artists" options={{ title: '관심 아티스트' }} />
        <Stack.Screen name="my/posts" options={{ title: '내가 쓴 글' }} />
        <Stack.Screen name="my/blocks" options={{ title: '차단한 사용자' }} />
        <Stack.Screen name="my/profile" options={{ title: '회원정보' }} />
        <Stack.Screen name="my/password" options={{ title: '비밀번호 변경' }} />
      </Stack.Protected>

      {/* 로그아웃 상태에서만 (로그인한 채로 열면 첫 화면으로 보낸다) */}
      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" options={authScreenOptions} />
        <Stack.Screen name="signup" options={authScreenOptions} />
        <Stack.Screen name="forgot-password" options={authScreenOptions} />
      </Stack.Protected>
    </Stack>
  );
}
