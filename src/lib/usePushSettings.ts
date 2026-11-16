import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  getPushPermission,
  PushError,
  registerDevice,
  requestPushPermission,
  setDeviceEnabled,
  type PushPermission,
} from '@/lib/push';
import { pushStorage } from '@/lib/storage';

// 푸시 설정 화면의 상태: 기기의 알림 권한, 서버에 등록돼 푸시를 받는 중인지
export function usePushSettings() {
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const perm = await getPushPermission();
    setPermission(perm);
    setRegistered(Boolean(await pushStorage.getToken()));
    setEnabled((await pushStorage.getToken()) ? await pushStorage.getEnabled() : false);
  }, []);

  useEffect(() => {
    // 화면이 열리면 현재 상태를 읽고, 시스템 설정에서 권한을 바꾸고 돌아오면 다시 읽는다
    const first = setTimeout(refresh, 0);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(first);
      sub.remove();
    };
  }, [refresh]);

  // 켜기: 권한을 받고, 기기를 등록하고, 푸시를 켠다. 오류는 사용자에게 보여줄 문구로 던진다.
  const turnOn = useCallback(async () => {
    setBusy(true);
    try {
      const perm = await requestPushPermission();
      setPermission(perm);
      if (perm !== 'granted') return;
      let isOn = await registerDevice();
      // 서버에 이미 있던 기기가 꺼져 있었다면 켠다
      if (!isOn) isOn = await setDeviceEnabled(true);
      setRegistered(true);
      setEnabled(isOn);
    } finally {
      setBusy(false);
    }
  }, []);

  const turnOff = useCallback(async () => {
    setBusy(true);
    try {
      setEnabled(await setDeviceEnabled(false));
    } finally {
      setBusy(false);
    }
  }, []);

  return { permission, enabled, registered, busy, turnOn, turnOff, refresh, PushError };
}
