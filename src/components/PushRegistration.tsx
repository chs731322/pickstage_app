import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { notificationTarget } from '@/features/notifications';
import { useAuth } from '@/lib/auth';
import { getPushPermission, isPushSupported, registerDevice } from '@/lib/push';

// 화면 없이 도는 부품: (1) 로그인한 상태에서 알림 권한이 이미 허용돼 있으면 이 기기를 서버에 등록·갱신하고,
// (2) 푸시 알림을 누르면 그 공연·글로 이동한다. 권한을 묻는 건 푸시 설정 화면에서만 한다.
export function PushRegistration() {
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isLoggedIn || !isPushSupported) return;
    (async () => {
      try {
        if ((await getPushPermission()) === 'granted') await registerDevice();
      } catch {
        // 등록은 다음에 앱을 켤 때 다시 시도한다
      }
    })();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isPushSupported) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data as { festivalId?: number; postId?: number } | undefined;
      if (!data) return;
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const target = notificationTarget(data);
      if (target) router.push(target as never);
    };
    // 앱이 꺼져 있다가 알림을 눌러서 켜진 경우
    Notifications.getLastNotificationResponseAsync().then(open, () => {});
    // 앱이 켜져 있거나 백그라운드일 때 알림을 누른 경우
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, [queryClient]);

  return null;
}
