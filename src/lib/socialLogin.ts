import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/config';
import type { ApiResponse, AuthResult } from '@/types/api';

export type SocialProvider = 'kakao' | 'google';

// 서버가 로그인을 끝낸 뒤 앱으로 돌아오는 주소 (서버 application.properties 의 app.oauth-return-url 과 같아야 한다)
const RETURN_URL = 'pickstage://oauth';

// 카카오·구글 로그인.
//  1) 서버의 시작 주소를 인앱 브라우저로 연다 → 서버가 카카오/구글 로그인 화면으로 보낸다
//  2) 로그인이 끝나면 서버가 로그인·가입을 처리하고 pickstage://oauth?ticket=... 로 돌려보낸다
//  3) 받은 1회용 티켓을 서버에 보내 토큰을 받는다
// 사용자가 창을 닫으면 null, 서버가 거절하면(예: 이미 다른 방식으로 가입된 이메일) 그 문구로 Error를 던진다.
export async function loginWithProvider(provider: SocialProvider): Promise<AuthResult | null> {
  const state = Crypto.randomUUID().replaceAll('-', '');
  const startUrl = `${API_BASE_URL}/api/auth/app/${provider}/start?state=${state}`;

  const result = await WebBrowser.openAuthSessionAsync(startUrl, RETURN_URL);
  if (result.type !== 'success') return null;

  const params = parseQuery(result.url);
  // 우리가 시작한 로그인에서 돌아온 것인지 확인한다 (다른 곳에서 만든 요청이 끼어드는 것을 막는다)
  if (params.state !== state) {
    throw new Error('로그인 정보가 올바르지 않아요. 다시 시도해주세요.');
  }
  if (params.error) throw new Error(params.error);
  const ticket = params.ticket;
  if (!ticket) throw new Error('로그인을 완료하지 못했어요. 다시 시도해주세요.');

  const res = await api.post<ApiResponse<AuthResult>>('/api/auth/app/ticket', { ticket });
  return res.data.data;
}

// 'pickstage://oauth?ticket=abc&state=xyz' 의 물음표 뒤를 {ticket, state}로 푼다 (앱 환경의 URL 파서는 불완전해서 직접 푼다)
function parseQuery(url: string): Record<string, string> {
  const query = url.split('#')[0].split('?')[1] ?? '';
  const out: Record<string, string> = {};
  for (const pair of query.split('&')) {
    if (!pair) continue;
    const [key, ...rest] = pair.split('=');
    try {
      out[decodeURIComponent(key)] = decodeURIComponent(rest.join('=').replaceAll('+', ' '));
    } catch {
      // 깨진 값은 무시한다
    }
  }
  return out;
}
