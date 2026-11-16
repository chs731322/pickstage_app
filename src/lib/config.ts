// 서버 주소. 개발 중에 내 컴퓨터의 서버를 쓰려면 .env에 EXPO_PUBLIC_API_BASE_URL을 적는다 (폰에서는 localhost가 아니라 컴퓨터의 IP).
// 주의: EXPO_PUBLIC_ 변수는 앱에 그대로 들어가서 누구나 볼 수 있으니, 비밀번호나 키를 넣지 않는다.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://pickstagebackend-production.up.railway.app';
