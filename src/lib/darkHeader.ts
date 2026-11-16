import { Platform } from 'react-native';

import { colors } from '@/theme';

// 맨 위가 검정인 화면(공연·아티스트·공연장 상세)의 제목줄: 흰 글자, 제목 없음.
// iOS는 내용 위에 떠 있는 투명한 제목줄, 그 외에는 검정 제목줄.
export const darkHeaderOptions = {
  title: '',
  headerTintColor: colors.white,
  headerShadowVisible: false,
  ...(Platform.OS === 'ios'
    ? { headerBlurEffect: 'none' as const }
    : { headerStyle: { backgroundColor: '#000000' } }),
};
