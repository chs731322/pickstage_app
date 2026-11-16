import { api } from '@/lib/api';
import type { ApiResponse, AuthResult } from '@/types/api';

// 회원가입에 쓰는 서버 호출 모음 (웹 frontend/src/services/authService.js와 같은 API).
// 서버가 거절하면 예외가 나고, 문구는 errorMessage()로 꺼내 화면에 보여준다.

// 가입 가능한 이메일인지 확인 (이미 가입했다면 409 "이미 가입된 이메일입니다.")
export async function checkEmailAvailable(email: string): Promise<void> {
  await api.get('/api/auth/check-email', { params: { email } });
}

// 이메일로 인증번호 6자리 발송. 메일 서버 응답이 느릴 수 있어서 이 요청만 시간 제한을 늘린다.
export async function sendEmailCode(email: string): Promise<void> {
  await api.post('/api/auth/email/send', { email }, { timeout: 30000 });
}

// 받은 인증번호 확인 (유효시간 5분)
export async function verifyEmailCode(email: string, verifyCode: string): Promise<void> {
  await api.post('/api/auth/email/verify', { email, verifyCode });
}

// 닉네임 중복 확인
export async function checkNicknameAvailable(nickname: string): Promise<{ available: boolean; message: string }> {
  const res = await api.get<ApiResponse<{ available: boolean }>>('/api/users/check-nickname', {
    params: { nickname },
  });
  return { available: res.data.data.available, message: res.data.message ?? '' };
}

// 회원가입. 성공하면 바로 로그인된 상태의 토큰과 사용자 정보를 돌려준다.
export async function signUp(input: { email: string; password: string; nickname: string }): Promise<AuthResult> {
  const res = await api.post<ApiResponse<AuthResult>>('/api/auth/signup', input);
  return res.data.data;
}
