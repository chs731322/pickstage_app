import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setSessionExpiredHandler } from '@/lib/api';
import { unregisterDevice } from '@/lib/push';
import { loginWithProvider, type SocialProvider } from '@/lib/socialLogin';
import { sessionStorage } from '@/lib/storage';
import type { ApiResponse, AuthResult, User } from '@/types/api';

type AuthContextValue = {
  user: User | null;
  isLoggedIn: boolean;
  // 앱을 켠 직후, 저장된 로그인 정보를 읽는 동안 true
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  // Apple로 받은 identity token으로 로그인 (처음이면 서버가 가입시킨다). fullName은 Apple이 처음에만 준다.
  signInWithApple: (identityToken: string, fullName?: string) => Promise<void>;
  // 카카오·구글: 서버가 이미 로그인을 끝내고 돌려준 결과로 로그인 상태를 만든다
  signInWithSocial: (provider: SocialProvider) => Promise<void>;
  signOut: () => Promise<void>;
  // 회원가입 직후처럼, 서버가 이미 토큰을 준 경우에 로그인 상태로 만든다
  applyAuthResult: (result: AuthResult) => Promise<void>;
  // 닉네임을 바꾸는 것처럼 내 정보가 달라졌을 때, 저장된 정보와 화면을 함께 갱신한다
  updateUser: (user: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 앱을 켜면 저장된 로그인 정보를 읽는다 (토큰이 만료됐다면 첫 요청 때 자동으로 갱신된다)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [token, stored] = await Promise.all([sessionStorage.getAccessToken(), sessionStorage.getUser()]);
      if (!cancelled) {
        setUser(token && stored ? stored : null);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 로그인 정보가 바뀌면(로그아웃, 세션 만료) 이전 사용자의 화면 데이터가 남지 않도록 캐시를 비운다
  const resetSession = useCallback(() => {
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(resetSession);
    return () => setSessionExpiredHandler(null);
  }, [resetSession]);

  const applyAuthResult = useCallback(async (result: AuthResult) => {
    await sessionStorage.saveTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    await sessionStorage.saveUser(result.user);
    setUser(result.user);
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<ApiResponse<AuthResult>>('/api/auth/signin', { email, password });
      await applyAuthResult(res.data.data);
    },
    [applyAuthResult],
  );

  const updateUser = useCallback(async (next: User) => {
    await sessionStorage.saveUser(next);
    setUser(next);
  }, []);

  const signInWithApple = useCallback(
    async (identityToken: string, fullName?: string) => {
      const res = await api.post<ApiResponse<AuthResult>>('/api/auth/apple', { identityToken, fullName });
      await applyAuthResult(res.data.data);
    },
    [applyAuthResult],
  );

  const signInWithSocial = useCallback(
    async (provider: SocialProvider) => {
      const result = await loginWithProvider(provider);
      if (result) await applyAuthResult(result);
    },
    [applyAuthResult],
  );

  const signOut = useCallback(async () => {
    // 로그아웃하면 이 기기로 푸시가 가지 않게 먼저 등록을 지운다 (아직 로그인 토큰이 있을 때)
    await unregisterDevice();
    try {
      await api.post('/api/auth/signout');
    } catch {
      // 서버 호출이 실패해도 이 기기의 로그인 정보는 지운다
    }
    await sessionStorage.clear();
    resetSession();
  }, [resetSession]);

  const value = useMemo(
    () => ({ user, isLoggedIn: user !== null, isLoading, signIn, signInWithApple, signInWithSocial, signOut, applyAuthResult, updateUser }),
    [user, isLoading, signIn, signInWithApple, signInWithSocial, signOut, applyAuthResult, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있어요.');
  }
  return context;
}
