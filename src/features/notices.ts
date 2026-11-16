import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export type NoticeListItem = {
  id: number;
  title: string;
  // 서버 필드 이름은 isPinned (Lombok boolean → JSON "pinned" 로 나올 수 있어 둘 다 받는다)
  isPinned?: boolean;
  pinned?: boolean;
  createdAt: string | null;
};

export type NoticeDetail = NoticeListItem & {
  content: string;
  updatedAt: string | null;
};

type NoticePage = {
  content: NoticeListItem[];
  totalElements: number;
  totalPages: number;
  page: number;
};

const PAGE_SIZE = 20;

export const isPinnedNotice = (notice: NoticeListItem) => Boolean(notice.isPinned ?? notice.pinned);

// 공지사항 목록 (제목·내용 검색, 20개씩 이어 불러오기)
export function useNotices(keyword: string) {
  const trimmed = keyword.trim();
  return useInfiniteQuery({
    queryKey: ['notices', trimmed],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ApiResponse<NoticePage>>('/api/notices', {
        params: { page: pageParam, size: PAGE_SIZE, keyword: trimmed || undefined },
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useNotice(id: string | undefined) {
  return useQuery({
    queryKey: ['notice', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<NoticeDetail>>(`/api/notices/${id}`);
      return res.data.data;
    },
  });
}
