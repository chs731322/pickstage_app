// PICKSTAGE 앱의 색, 글꼴, 간격. 웹(p1cksta9e.com)과 같은 브랜드 색을 쓴다.
export const colors = {
  brand: '#ff00b7',
  brandSoft: '#fff0fa',
  brandBg: '#ffd7d7',
  text: '#111111',
  textSecondary: '#545454',
  textMuted: '#7f7f7f',
  border: '#e6e6e6',
  surface: '#f5f5f7',
  background: '#ffffff',
  danger: '#d90000',
  white: '#ffffff',
} as const;

// Pretendard (웹과 같은 글꼴). 앱 시작 때 src/app/_layout.tsx에서 불러온다.
export const fontFiles = {
  'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.otf'),
  'Pretendard-Medium': require('../../assets/fonts/Pretendard-Medium.otf'),
  'Pretendard-SemiBold': require('../../assets/fonts/Pretendard-SemiBold.otf'),
  'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.otf'),
  'Pretendard-ExtraBold': require('../../assets/fonts/Pretendard-ExtraBold.otf'),
};

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extrabold: 'Pretendard-ExtraBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 16, pill: 999 } as const;
