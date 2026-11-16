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
  // 홈 같은 목록 화면의 바탕 (흰 카드가 돋보이게 아주 옅은 회색)
  pageBg: '#f6f6f9',
  // 검정 히어로 위의 보조 글자색
  heroMuted: '#b8b8c0',
  danger: '#d90000',
  success: '#0a8a4a',
  // 입력칸의 지우기(×) 버튼 배경
  clearButton: '#b8b8be',
  // 부드러운 화면(로그인·가입)용: 은은한 테두리, 입력칸 포커스 색, 그림자 색 (브랜드 핑크 계열)
  softBorder: '#f0e3ec',
  focus: '#ff4fc3',
  shadow: '#ff4fc3',
  // 하단 탭바: 선택하지 않은 탭의 아이콘·글자 색
  tabInactive: '#9a9aa0',
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

// 주 버튼의 그라데이션 (밝은 핑크 → 브랜드 핑크, 왼쪽에서 오른쪽)
export const buttonGradient = ['#ff5cc6', '#f000b0'] as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 16, pill: 999 } as const;
