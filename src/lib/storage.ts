import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { User } from '@/types/api';

// 로그인 정보 보관: 폰에서는 안전한 저장소(iOS 키체인, Android 키스토어)에, 웹 미리보기에서는 localStorage에 둔다.
const KEYS = { access: 'accessToken', refresh: 'refreshToken', user: 'user' } as const;

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return globalThis.localStorage?.getItem(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export type Tokens = { accessToken: string; refreshToken: string };

export const sessionStorage = {
  getAccessToken: () => getItem(KEYS.access),
  getRefreshToken: () => getItem(KEYS.refresh),

  async saveTokens({ accessToken, refreshToken }: Tokens) {
    await setItem(KEYS.access, accessToken);
    await setItem(KEYS.refresh, refreshToken);
  },

  async saveUser(user: User) {
    await setItem(KEYS.user, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    try {
      const raw = await getItem(KEYS.user);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  async clear() {
    await Promise.all(Object.values(KEYS).map(deleteItem));
  },
};
