import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { InterestedArtist } from '@/features/artists';
import type { PostListItem } from '@/features/community';
import type { FestivalSummary } from '@/features/festivals';
import type { MyReview, Privacy } from '@/features/me';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

export type UserProfile = {
  id: number;
  nickname: string;
  profileImage: string | null;
  createdAt: string | null;
  // 내 프로필이면 true
  self: boolean;
  // 보는 사람 기준으로 볼 수 있는 항목 (본인이면 모두 true)
  visible: Privacy;
};

type Page<T> = { content: T[]; page: number; totalElements: number; totalPages: number };

const PAGE_SIZE = 10;

// 다른 사용자의 프로필 (로그인 필요). 서버가 차단 관계면 "차단" 문구가 든 오류를 준다.
export function useUserProfile(id: string | undefined) {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['user', id, 'profile'],
    enabled: Boolean(id) && isLoggedIn,
    retry: false,
    queryFn: async () => {
      const res = await api.get<ApiResponse<UserProfile>>(`/api/users/${id}/profile`);
      return res.data.data;
    },
  });
}

export function useUserBookmarks(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['user', id, 'bookmarks'],
    enabled: Boolean(id) && enabled,
    queryFn: async () => (await api.get<ApiResponse<FestivalSummary[]>>(`/api/users/${id}/bookmarks`)).data.data ?? [],
  });
}

export function useUserArtists(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['user', id, 'artists'],
    enabled: Boolean(id) && enabled,
    queryFn: async () => (await api.get<ApiResponse<InterestedArtist[]>>(`/api/users/${id}/artists`)).data.data ?? [],
  });
}

export function useUserPosts(id: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['user', id, 'posts'],
    enabled: Boolean(id) && enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (await api.get<ApiResponse<Page<PostListItem>>>(`/api/users/${id}/posts`, { params: { page: pageParam, size: PAGE_SIZE } })).data.data,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function useUserReviews(id: string | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['user', id, 'reviews'],
    enabled: Boolean(id) && enabled,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (await api.get<ApiResponse<Page<MyReview>>>(`/api/users/${id}/reviews`, { params: { page: pageParam, size: PAGE_SIZE } })).data.data,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}
