import axios, { create as createAxios, isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '@/lib/config';
import { sessionStorage } from '@/lib/storage';
import type { ApiResponse, AuthResult } from '@/types/api';

// 서버(백엔드)와 통신하는 공용 클라이언트. 웹(frontend/src/services/api.js)과 같은 규칙을 쓴다.
// - 요청마다 저장된 액세스 토큰을 붙인다.
// - 401(토큰 만료)이면 리프레시 토큰으로 새 토큰을 받고 요청을 한 번 다시 보낸다.
// - 새 토큰도 받을 수 없으면 로그인 정보를 지우고, 화면(AuthProvider)에 알려서 로그아웃 상태로 돌린다.
export const api = createAxios({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// 토큰 재발급 대상이 아닌 공개 인증 요청 (이 요청들의 401은 "아이디·비밀번호가 틀림" 같은 뜻이다)
const PUBLIC_AUTH_URLS = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/reissue',
  '/api/auth/check-email',
  '/api/auth/email/send',
  '/api/auth/email/verify',
  '/api/auth/password/reset-email',
  '/api/auth/password/reset',
];

const isPublicAuthRequest = (config?: InternalAxiosRequestConfig) =>
  PUBLIC_AUTH_URLS.some((url) => config?.url?.includes(url));

// 세션이 끝났을 때(리프레시도 실패) 부를 함수. AuthProvider가 등록한다.
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

api.interceptors.request.use(async (config) => {
  const token = await sessionStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 한다 (리프레시 토큰은 한 번 쓰면 바뀌기 때문)
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await sessionStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('no refresh token');
  }
  // 인터셉터가 걸린 api 대신 새 axios를 써서, 재발급 요청이 다시 재발급을 부르지 않게 한다
  const res = await axios.post<ApiResponse<Pick<AuthResult, 'accessToken' | 'refreshToken'>>>(
    `${API_BASE_URL}/api/auth/reissue`,
    { refreshToken },
    { timeout: 10000 },
  );
  await sessionStorage.saveTokens(res.data.data);
  return res.data.data.accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && original && !original._retry && !isPublicAuthRequest(original)) {
      original._retry = true;
      try {
        refreshing ??= refreshAccessToken().finally(() => {
          refreshing = null;
        });
        const accessToken = await refreshing;
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        await sessionStorage.clear();
        onSessionExpired?.();
      }
    }
    return Promise.reject(error);
  },
);

// 서버가 보낸 오류 문구(예: "이미 신고한 대상입니다.")를 꺼낸다. 없으면 기본 문구.
export function errorMessage(error: unknown, fallback = '잠시 후 다시 시도해주세요.'): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as ApiResponse<unknown> | undefined)?.message;
    if (message) return message;
    if (!error.response) return '서버에 연결하지 못했어요. 인터넷 연결을 확인해주세요.';
  }
  return fallback;
}
