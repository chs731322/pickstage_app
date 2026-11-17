// PICKSTAGE 앱의 색, 글꼴, 간격. 웹(p1cksta9e.com)과 같은 브랜드 색을 쓴다.

// 브랜드 핑크를 연한 것부터 진한 것까지 나눈 단계. 뱃지·배경·눌림 같은 곳에서 이 단계 중에서 골라 쓴다.
//  50: 아주 옅은 배경 / 100: 옅은 칩·강조 배경 / 300: 장식 / 500: 브랜드(기본) / 600: 진한 글자·눌림 / 700: 아주 진한 강조
export const brandScale = {
  50: '#fff0fa',
  100: '#ffd9f3',
  200: '#ffb3e8',
  300: '#ff80d8',
  400: '#ff4fc3',
  500: '#ff00b7',
  600: '#d6009a',
  700: '#a8007a',
} as const;

export const colors = {
  brand: brandScale[500],
  brandSoft: brandScale[50],
  // 옅은 핑크 칩·강조 박스 배경 (brandSoft보다 한 단계 진함)
  brandTint: brandScale[100],
  // 핑크 배경 위에 올리는 진한 핑크 글자, 핑크로 채운 버튼을 눌렀을 때의 색
  brandStrong: brandScale[600],
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
  focus: brandScale[400],
  shadow: brandScale[400],
  // 하단 탭바: 선택하지 않은 탭의 아이콘·글자 색
  tabInactive: '#9a9aa0',
  // 홈의 파란 띠(티켓 오픈·주간 캘린더 영역) 배경 (웹 메인과 같은 하늘색)
  sky: '#b7eaff',
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

// 흰 카드에 은은하게 띄우는 그림자 (홈의 카드들이 같은 느낌이 되도록 한 곳에서 정한다)
export const cardShadow = {
  shadowColor: '#1a1a2e',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.07,
  shadowRadius: 14,
  elevation: 2,
} as const;

