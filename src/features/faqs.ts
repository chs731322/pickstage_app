import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export type Faq = { id: number; question: string; category: string | null; answer?: string };

// 목록 응답에는 답변이 없어서, 펼쳐 보기와 검색에 쓰도록 상세를 함께 받아 채운다 (웹과 같은 방식)
export function useFaqs() {
  return useQuery({
    queryKey: ['faqs'],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Faq[]>>('/api/faqs');
      return Promise.all(
        (res.data.data ?? []).map((faq) =>
          api
            .get<ApiResponse<{ answer: string }>>(`/api/faqs/${faq.id}`)
            .then((detail): Faq => ({ ...faq, answer: detail.data.data.answer }))
            .catch((): Faq => faq),
        ),
      );
    },
  });
}
