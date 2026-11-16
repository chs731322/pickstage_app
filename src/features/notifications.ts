import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

export type NotificationType = 'ticket_open' | 'concert_day' | 'custom' | 'comment';

export type NotificationItem = {
  id: number;
  type: NotificationType | string;
  title: string;
  message: string;
  festivalId: number | null;
  festivalTitle: string | null;
  postId: number | null;
  isRead: boolean;
  sentAt: string;
};

type NotificationPage = { totalElement: number; totalPages: number; page: number; content: NotificationItem[] };

export const NOTIFICATION_TYPE_LABEL: Record<string, string> = {
  ticket_open: '티켓 오픈',
  concert_day: '공연 당일',
  custom: '내 알림',
  comment: '댓글',
};

const PAGE_SIZE = 20;

// 알림 목록 (unreadOnly면 안 읽은 알림만)
export function useNotifications(unreadOnly: boolean) {
  const { isLoggedIn } = useAuth();
  return useInfiniteQuery({
    queryKey: ['notifications', 'list', unreadOnly],
    enabled: isLoggedIn,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ApiResponse<NotificationPage>>('/api/notifications', {
        params: { isRead: unreadOnly ? false : undefined, page: pageParam, size: PAGE_SIZE },
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

// 안 읽은 알림 개수 (홈의 종 모양 아이콘 배지). 1분마다 다시 확인한다.
export function useUnreadCount() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<NotificationPage>>('/api/notifications', { params: { isRead: false, page: 0, size: 1 } });
      return res.data.data.totalElement ?? 0;
    },
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => api.patch(`/api/notifications/${id}/read`)));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// 알림을 눌렀을 때 갈 곳: 댓글 알림은 그 글로, 티켓·공연 알림은 그 공연으로 (웹과 같은 규칙)
export function notificationTarget(n: { postId?: number | null; festivalId?: number | null }): string | null {
  if (n.postId) return `/community/${n.postId}`;
  if (n.festivalId) return `/festival/${n.festivalId}`;
  return null;
}

// ───── 사용자 지정 알림 (공연 하나에 원하는 시각으로 예약) ─────

export type CustomNotification = { id: number; festivalId: number; scheduledAt: string; message: string | null };

export const CUSTOM_NOTIFICATION_MAX = 3;

export function useCustomNotifications(festivalId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['notifications', 'custom', festivalId],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiResponse<CustomNotification[]>>('/api/notifications/custom', { params: { festivalId } });
      return res.data.data ?? [];
    },
  });
}

export function useCreateCustomNotification(festivalId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { scheduledAt: string; message?: string }) => {
      await api.post('/api/notifications/custom', { festivalId, ...input });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'custom', festivalId] }),
  });
}

export function useDeleteCustomNotification(festivalId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/notifications/custom/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', 'custom', festivalId] }),
  });
}
