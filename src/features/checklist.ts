import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

export type ChecklistItem = { id: number; content: string; isChecked: boolean; isCustom: boolean; sortOrder: number };

export const CHECKLIST_CONTENT_MAX = 200;

// 로그인 전에 홈에서 보여주는 꼭 챙겨야 할 준비물 (로그인하면 내 체크리스트로 바뀐다. 웹과 같은 목록)
export const ESSENTIAL_ITEMS = [
  '모바일 티켓 & 실물 신분증',
  '규격에 맞는 돗자리 (1m x 1m)',
  '자외선 차단제, 선글라스',
  '500ml 이하 생수 (페트병)',
  '대용량 보조배터리',
];

const KEY = ['checklist'];

// 내 체크리스트 (처음 조회하면 서버가 기본 준비물을 복사해서 만들어 준다)
export function useChecklist() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: KEY,
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await api.get<ApiResponse<ChecklistItem[]>>('/api/checklists');
      return [...(res.data.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    },
  });
}

// 체크/해제는 화면에 바로 반영하고(낙관적), 실패하면 되돌린다
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isChecked }: { id: number; isChecked: boolean }) => {
      await api.patch(`/api/checklists/${id}`, { isChecked });
    },
    onMutate: async ({ id, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<ChecklistItem[]>(KEY);
      queryClient.setQueryData<ChecklistItem[]>(KEY, (old) => old?.map((i) => (i.id === id ? { ...i, isChecked } : i)));
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) queryClient.setQueryData(KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (content: string) => {
      await api.post('/api/checklists', { content });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRenameChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      await api.patch(`/api/checklists/${id}`, { content });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/checklists/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
