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

// ───── 색 ─────
// 화면에서는 색 값(#...)을 직접 적지 않고 여기 이름을 쓴다. 새 색이 필요하면 먼저 여기에 단계를 추가한다.

// 회색 단계: 50 카드·버튼 / 100 카드 안의 칸 / 200 선 / 300 흐린 장식 / 400 꺼진 아이콘 / 500 보조 글자 / 700 본문 보조 / 900 글자
export const greyScale = {
  50: '#f5f6f8',
  100: '#ecedf0',
  200: '#e6e6e6',
  300: '#b8b8be',
  400: '#9a9aa0',
  500: '#7f7f7f',
  700: '#545454',
  900: '#111111',
} as const;

// 스티커·장식에 쓰는 포인트 색 (인스타 캐러셀과 같은 색)
export const stickerColors = { navy: '#131f4a', lime: '#d9f56a', pink: brandScale[300] } as const;

// 다른 회사 로그인 버튼 색 (각 회사 규정이라 바꾸지 않는다)
export const socialColors = { kakao: '#FEE500', apple: '#000000' } as const;

// 캘린더에서 공연을 색으로 구별할 때: [바탕, 글자]
export const calendarPalette: [string, string][] = [
  ['#ffd9e6', '#a8335f'],
  ['#d9e8ff', '#2c5aa0'],
  ['#dcf3dd', '#2b7a4b'],
  ['#fff0c7', '#8a6a00'],
  ['#e6dcff', '#5a44ae'],
  ['#d5f2f0', '#1e7872'],
  ['#ffe2d3', '#a1461e'],
  ['#f1dff7', '#84409a'],
  ['#e5f1c8', '#53701a'],
  ['#d6e9f3', '#2a6583'],
];

export const colors = {
  brand: brandScale[500],
  brandSoft: brandScale[50],
  // 옅은 핑크 칩·강조 박스 배경 (brandSoft보다 한 단계 진함)
  brandTint: brandScale[100],
  // 핑크 배경 위에 올리는 진한 핑크 글자, 핑크로 채운 버튼을 눌렀을 때의 색
  brandStrong: brandScale[600],
  // 옅은 핑크 바탕 위의 보조 글자 (회색을 올리면 탁해 보여서 같은 계열로)
  onBrandSoft: '#8f3a70',
  text: greyScale[900],
  textSecondary: greyScale[700],
  textMuted: greyScale[500],
  border: greyScale[200],
  surface: greyScale[100],
  background: '#ffffff',
  // 화면 바탕은 흰색, 그 위의 카드·버튼·검색칸은 연회색(card). 선과 그림자 없이 색으로 구분한다.
  pageBg: '#ffffff',
  card: greyScale[50],
  // 검정 히어로 위의 보조 글자색
  heroMuted: greyScale[300],
  // 상태 색: 오류·삭제, 오류 안내 바탕, 성공, 별점, 토요일
  danger: '#d90000',
  dangerSoft: '#fff2f2',
  success: '#0a8a4a',
  star: '#ffb400',
  saturday: '#3b6fd4',
  // 입력칸의 지우기(×) 버튼 배경
  clearButton: greyScale[300],
  // 부드러운 화면(로그인·가입)용: 은은한 테두리, 입력칸 포커스 색, 그림자 색 (브랜드 핑크 계열)
  softBorder: '#f0e3ec',
  focus: brandScale[400],
  shadow: brandScale[400],
  // 카드를 띄우는 그림자 색
  shadowInk: '#1a1a2e',
  black: '#000000',
  // 하단 탭바: 선택하지 않은 탭의 아이콘·글자 색
  tabInactive: greyScale[400],
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
  // 핵심 제목에만 쓰는 장식 글꼴 (콘텐츠웨이브 Wavve PADO, 상업 이용·앱 탑재 가능, 로고·CI 용도는 불가)
  'Wavve-PADO': require('../../assets/fonts/WavvePADO-Regular.otf'),
};

export const fontFamily = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extrabold: 'Pretendard-ExtraBold',
  // 장식 글꼴은 홈(메인) 화면의 배너·섹션 제목에만 쓴다. 다른 화면은 모두 Pretendard
  display: 'Wavve-PADO',
} as const;

// 주 버튼의 그라데이션 (밝은 핑크 → 브랜드 핑크, 왼쪽에서 오른쪽)
export const buttonGradient = ['#ff5cc6', '#f000b0'] as const;

// ───── 화면 규격 ─────
// 새 화면을 만들 때도 아래 값 안에서만 고른다. 중간값(10, 14, 18 같은)을 만들지 않는다.

// 폰에서 글자를 크게 설정해도 이 배율까지만 커진다 (칸이 깨지지 않게 하는 절충)
export const MAX_FONT_SCALE = 1.3;

// 글자 크기 6단계: 12 보조 라벨 / 13 시간·개수 같은 부가 정보 / 14 본문 / 16 목록 제목·버튼 / 18 섹션 제목 / 22 화면 제목
export type TextSize = 12 | 13 | 14 | 16 | 18 | 22;
// 여백: 같은 묶음 안은 좁게(xs·sm), 항목 사이는 ms, 카드 안쪽·화면 좌우는 md, 서로 다른 묶음 사이는 lg·xl
export const spacing = { xs: 4, sm: 8, ms: 12, md: 16, lg: 24, xl: 32 } as const;
// 모서리: sm 작은 칩·체크칸 / md 사진·입력칸 / lg 카드 / pill 알약 버튼
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

