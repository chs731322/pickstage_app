import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse, User } from '@/types/api';

// ───── 차단한 사용자 ─────

export type BlockedUser = { userId: number; nickname: string; profileImage: string | null; blockedAt: string | null };

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['blocks'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<BlockedUser[]>>('/api/blocks/me');
      return res.data.data ?? [];
    },
  });
}

export function useUnblock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/api/blocks/${userId}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blocks'] }),
  });
}

// ───── 프로필 공개 설정 ─────

export type Privacy = { showBookmarks: boolean; showArtists: boolean; showPosts: boolean; showReviews: boolean };

export function usePrivacy() {
  return useQuery({
    queryKey: ['privacy'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Privacy>>('/api/users/mypage/privacy');
      return res.data.data;
    },
  });
}

// 바꾸면 바로 저장한다 (값을 보낸 항목만 바뀐다)
export function useUpdatePrivacy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Privacy>) => {
      const res = await api.patch<ApiResponse<Privacy>>('/api/users/mypage/privacy', patch);
      return res.data.data;
    },
    onSuccess: (data) => queryClient.setQueryData(['privacy'], data),
  });
}

// ───── 내 정보 ─────

// 닉네임 변경. 서버가 돌려준 최신 내 정보로 로그인 상태도 함께 갱신한다.
export function useUpdateNickname() {
  const { user, updateUser } = useAuth();
  return useMutation({
    mutationFn: async (nickname: string) => {
      const res = await api.patch<ApiResponse<User>>('/api/users/mypage', { nickname });
      return res.data.data;
    },
    onSuccess: async (data) => {
      if (user) await updateUser({ ...user, nickname: data.nickname, profileImage: data.profileImage ?? user.profileImage });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      await api.patch('/api/users/mypage/password', input);
    },
  });
}

// 회원 탈퇴 (서버가 개인 정보를 지우고 계정을 비활성화한다). 끝나면 호출한 쪽에서 로그아웃 처리를 한다.
export async function withdrawAccount() {
  await api.delete('/api/users/mypage');
}

// ───── 내가 쓴 글 ─────

export type MyPost = {
  id: number;
  category: string;
  title: string;
  festivalId: number | null;
  festivalTitle: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export type MyReview = {
  id: number;
  venueName: string;
  rating: number;
  content: string;
  viewInfo: string | null;
  standingTip: string | null;
  seatSection: string | null;
  createdAt: string | null;
  images: string[] | null;
};

type Page<T> = { content: T[]; page: number; totalElements: number; totalPages: number };

const MY_PAGE_SIZE = 10;

// 커뮤니티에 쓴 글 (category가 비어 있으면 전체). 항상 최신순.
export function useMyPosts(category: string) {
  return useInfiniteQuery({
    queryKey: ['my', 'posts', category],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ApiResponse<Page<MyPost>>>('/api/posts/me', {
        params: { category: category || undefined, page: pageParam, size: MY_PAGE_SIZE },
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useMyReviews(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['my', 'reviews'],
    enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ApiResponse<Page<MyReview>>>('/api/reviews', {
        params: { page: pageParam, size: MY_PAGE_SIZE },
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useUpdateMyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...values }: { id: number; rating: number; content: string; seatSection?: string; viewInfo?: string; standingTip?: string }) => {
      await api.patch(`/api/reviews/${id}`, values);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my', 'reviews'] }),
  });
}

export function useDeleteMyReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/reviews/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my', 'reviews'] }),
  });
}
