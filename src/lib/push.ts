import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { pushStorage } from '@/lib/storage';
import type { ApiResponse } from '@/types/api';

// 앱이 켜져 있을 때 도착한 푸시도 화면 위에 알림으로 보여준다
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

export type PushPermission = 'granted' | 'denied' | 'undetermined';

// 푸시는 실제 폰에서만 된다 (웹 미리보기·시뮬레이터에서는 사용할 수 없다)
export const isPushSupported = Platform.OS !== 'web' && Device.isDevice;

export async function getPushPermission(): Promise<PushPermission> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';
}

// 알림 권한을 요청한다 (이미 거절했다면 시스템 설정에서만 바꿀 수 있어서 그대로 denied가 돌아온다)
export async function requestPushPermission(): Promise<PushPermission> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

// 사용자에게 그대로 보여줄 수 있는 오류
export class PushError extends Error {}

// Expo 푸시 토큰을 받는다. EAS 프로젝트 ID가 있어야 받을 수 있다 (app.json 의 extra.eas.projectId).
async function getExpoPushToken(): Promise<string> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new PushError('푸시를 받으려면 앱을 EAS 프로젝트에 연결해야 해요. (eas init 으로 projectId를 만들어 app.json에 넣어주세요)');
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch {
    throw new PushError('이 기기의 푸시 토큰을 받지 못했어요. 인터넷 연결을 확인하고 다시 시도해주세요.');
  }
}

// 이 기기를 서버에 등록·갱신하고, 서버가 알려준 "푸시 받기" 켜짐 상태를 돌려준다
export async function registerDevice(): Promise<boolean> {
  const token = await getExpoPushToken();
  const res = await api.post<ApiResponse<{ enabled: boolean }>>('/api/push-tokens', {
    token,
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  await pushStorage.saveToken(token);
  const enabled = res.data.data.enabled;
  await pushStorage.saveEnabled(enabled);
  return enabled;
}

// 이 기기로 푸시를 받을지 켜고 끈다 (등록되어 있어야 한다)
export async function setDeviceEnabled(enabled: boolean): Promise<boolean> {
  const token = await pushStorage.getToken();
  if (!token) throw new PushError('이 기기가 아직 등록되지 않았어요.');
  const res = await api.patch<ApiResponse<{ enabled: boolean }>>('/api/push-tokens', { token, enabled });
  await pushStorage.saveEnabled(res.data.data.enabled);
  return res.data.data.enabled;
}

// 로그아웃할 때: 이 기기로 더 이상 푸시가 가지 않게 서버에서 등록을 지운다 (실패해도 로그아웃은 계속한다)
export async function unregisterDevice(): Promise<void> {
  try {
    const token = await pushStorage.getToken();
    if (token) await api.delete('/api/push-tokens', { data: { token } });
  } catch {
    // 서버에 닿지 않아도 이 기기의 정보는 지운다
  } finally {
    await pushStorage.clearToken();
  }
}

// 내 기기로 테스트 푸시 보내기 (서버가 1분에 한 번만 허용한다)
export async function sendTestPush(): Promise<void> {
  await api.post('/api/push-tokens/test');
}
