import { Platform } from 'react-native';

import { colors } from '@/theme';

// 맨 위가 하늘색 띠인 화면(공연·아티스트·공연장 상세)의 제목줄: 어두운 글자, 제목 없음.
// iOS는 내용 위에 떠 있는 투명한 제목줄, 그 외에는 하늘색 제목줄.
export const heroHeaderOptions = {
  title: '',
  headerTintColor: colors.text,
  headerShadowVisible: false,
  ...(Platform.OS === 'ios'
    ? { headerBlurEffect: 'none' as const }
    : { headerStyle: { backgroundColor: colors.sky } }),
};
