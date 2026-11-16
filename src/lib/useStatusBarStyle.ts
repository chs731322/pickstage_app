import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

// 이 화면이 보이는 동안만 상단 상태 표시줄(시간·배터리) 글자색을 바꾼다. 어두운 배경 화면은 'light'.
export function useStatusBarStyle(style: 'light' | 'dark') {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
      return () => setStatusBarStyle('dark');
    }, [style]),
  );
}
