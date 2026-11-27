import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export type HighlightTarget = 'festival' | 'venue';

export type ReviewKeyword = { keyword: string; count: number; sentiment: 'positive' | 'negative' | 'neutral' | string };

export type ReviewHighlights = {
  reviewCount: number;
  keywords: ReviewKeyword[] | null;
  updatedAt: string | null;
};

// 캐시에 없으면 서버가 AI(Gemini)를 불러 만들어서 10초 가까이 걸릴 수 있어, 기본 10초 타임아웃보다 길게 둔다 (웹과 같은 30초)
const HIGHLIGHT_TIMEOUT_MS = 30_000;

// 공연: 공연에 연결된 후기 글 기준 / 공연장: 공연장 후기 기준
export function useReviewHighlights(target: HighlightTarget, id: number) {
  return useQuery({
    queryKey: ['reviewHighlights', target, id],
    staleTime: 5 * 60_000,
    // 실패해도 화면에서 조용히 빼는 부가 정보라서 다시 시도하지 않는다 (AI를 거듭 부르지 않게)
    retry: false,
    queryFn: async () => {
      const path = target === 'venue' ? 'venues' : 'festivals';
      const res = await api.get<ApiResponse<ReviewHighlights>>(`/api/${path}/${id}/review-highlights`, {
        timeout: HIGHLIGHT_TIMEOUT_MS,
      });
      return { ...res.data.data, message: res.data.message };
    },
  });
}
