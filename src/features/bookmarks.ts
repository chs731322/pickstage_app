import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { FestivalSummary } from '@/features/festivals';
import type { ApiResponse } from '@/types/api';

// 내가 찜한 공연 (로그인했을 때만 불러온다)
export function useBookmarks() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['bookmarks'],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await api.get<ApiResponse<FestivalSummary[]>>('/api/bookmarks');
      return res.data.data ?? [];
    },
  });
}

// 찜하기/찜 취소. 공연 상세의 찜 수도 함께 새로 불러온다.
export function useToggleBookmark(festivalId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isBookmarked: boolean) => {
      if (isBookmarked) {
        await api.delete(`/api/bookmarks/${festivalId}`);
      } else {
        await api.post(`/api/bookmarks/${festivalId}`, { notifyTicketOpen: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['festival', String(festivalId)] });
    },
  });
}
