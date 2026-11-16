import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { extractImageUrls } from '@/lib/postContent';
import type { ApiResponse } from '@/types/api';

export const POST_CATEGORY_LABEL: Record<string, string> = {
  companion: '동행',
  lost: '분실물',
  free: '자유',
  review: '공연후기',
  goods: '굿즈거래',
};

export const POST_SORTS = [
  { id: 'latest', label: '최신순' },
  { id: 'likes', label: '좋아요순' },
  { id: 'views', label: '조회순' },
] as const;
export type PostSort = (typeof POST_SORTS)[number]['id'];

export type PostListItem = {
  id: number;
  category: string;
  title: string;
  authorId: number | null;
  authorNickname: string | null;
  authorProfileImage: string | null;
  festivalId: number | null;
  festivalTitle: string | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  preview: string | null;
  createdAt: string;
};

export type Comment = {
  id: number;
  parentId: number | null;
  content: string;
  authorId: number | null;
  authorNickname: string | null;
  authorProfileImage: string | null;
  createdAt: string;
};

export type PostDetail = Omit<PostListItem, 'commentCount' | 'preview'> & {
  content: string;
  liked: boolean;
  updatedAt: string | null;
  comments: Comment[] | null;
  images: string[] | null;
};

type Page<T> = { content: T[]; page: number; totalElements: number; totalPages: number };

const PAGE_SIZE = 12;

// 게시글 목록 (category가 비어 있으면 전체). 스크롤하면 다음 페이지를 이어서 불러온다.
export function usePosts(category: string, sort: PostSort) {
  const { isLoggedIn } = useAuth();
  return useInfiniteQuery({
    // 로그인 상태가 바뀌면 차단한 사람의 글이 빠지도록 목록을 새로 받는다
    queryKey: ['posts', 'list', category, sort, isLoggedIn],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<ApiResponse<Page<PostListItem>>>('/api/posts', {
        params: { category: category || undefined, sort, page: pageParam, size: PAGE_SIZE },
      });
      return res.data.data;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

export function usePost(id: string | undefined) {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['post', id, isLoggedIn],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<PostDetail>>(`/api/posts/${id}`);
      return res.data.data;
    },
  });
}

function useInvalidatePosts() {
  const queryClient = useQueryClient();
  return (id?: number) => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    queryClient.invalidateQueries({ queryKey: ['my', 'posts'] });
    if (id !== undefined) queryClient.invalidateQueries({ queryKey: ['post', String(id)] });
  };
}

// 좋아요/취소: 화면에는 바로 반영하고(낙관적), 실패하면 되돌린다
export function useTogglePostLike(postId: number) {
  const queryClient = useQueryClient();
  const { isLoggedIn } = useAuth();
  return useMutation({
    mutationFn: async (liked: boolean) => {
      if (liked) await api.delete(`/api/posts/${postId}/likes`);
      else await api.post(`/api/posts/${postId}/likes`);
    },
    onMutate: async (wasLiked) => {
      const key = ['post', String(postId), isLoggedIn];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PostDetail>(key);
      if (previous) {
        queryClient.setQueryData<PostDetail>(key, {
          ...previous,
          liked: !wasLiked,
          likeCount: previous.likeCount + (wasLiked ? -1 : 1),
        });
      }
      return { previous, key };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });
}

export type PostInput = { category: string; festivalId?: number | null; title: string; content: string };

export function useCreatePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: async (input: PostInput) => {
      const payload: Record<string, unknown> = {
        category: input.category,
        title: input.title,
        content: input.content,
        images: extractImageUrls(input.content),
      };
      if (input.festivalId) payload.festivalId = input.festivalId;
      await api.post('/api/posts', payload);
    },
    onSuccess: () => invalidate(),
  });
}

export function useUpdatePost(postId: number) {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: async (input: Omit<PostInput, 'festivalId'>) => {
      await api.patch(`/api/posts/${postId}`, { ...input, images: extractImageUrls(input.content) });
    },
    onSuccess: () => invalidate(postId),
  });
}

export function useDeletePost() {
  const invalidate = useInvalidatePosts();
  return useMutation({
    mutationFn: async (postId: number) => {
      await api.delete(`/api/posts/${postId}`);
    },
    onSuccess: () => invalidate(),
  });
}

// ───── 댓글 ─────

export function useCommentMutations(postId: number) {
  const invalidate = useInvalidatePosts();
  const create = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number | null }) => {
      await api.post(`/api/posts/${postId}/comments`, { content, ...(parentId ? { parentId } : {}) });
    },
    onSuccess: () => invalidate(postId),
  });
  const update = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      await api.patch(`/api/comments/${id}`, { content });
    },
    onSuccess: () => invalidate(postId),
  });
  const remove = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/comments/${id}`);
    },
    onSuccess: () => invalidate(postId),
  });
  return { create, update, remove };
}

// ───── 사진 올리기 ─────

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB (서버 제한과 같다)

export class UploadError extends Error {}

// 사진 보관함에서 사진을 골라(여러 장) 우리 이미지 저장소(S3)에 올리고, 사진 주소들을 돌려준다.
// 고르지 않고 닫으면 빈 배열.
export async function pickAndUploadImages(maxCount: number): Promise<string[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new UploadError('사진을 올리려면 사진 보관함 접근을 허용해주세요.');
  }
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    // 용량을 줄여서 올린다 (5MB 제한)
    quality: 0.7,
  });
  if (picked.canceled) return [];

  const urls: string[] = [];
  for (const asset of picked.assets.slice(0, maxCount)) {
    urls.push(await uploadAsset(asset));
  }
  return urls;
}

// 고른 사진 한 장을 우리 이미지 저장소(S3)에 올리고 주소를 돌려준다
async function uploadAsset(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  const contentType = asset.mimeType ?? 'image/jpeg';
  const blob = await (await fetch(asset.uri)).blob();
  if (blob.size > MAX_UPLOAD_SIZE) throw new UploadError('이미지는 5MB 이하만 올릴 수 있어요.');
  const presigned = await api.post<ApiResponse<{ uploadUrl: string; fileUrl: string }>>('/api/uploads/presigned-url', {
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    contentType,
    size: blob.size,
  });
  const { uploadUrl, fileUrl } = presigned.data.data;
  // S3에는 우리 서버용 헤더(로그인 토큰 등)를 붙이지 않고 직접 올린다
  const put = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: blob });
  if (!put.ok) throw new UploadError('사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.');
  return fileUrl;
}

// 프로필 사진: 사진 한 장을 골라 정사각형으로 자른 뒤 올린다. 고르지 않고 닫으면 null.
export async function pickAndUploadProfileImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new UploadError('사진을 올리려면 사진 보관함 접근을 허용해주세요.');
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (picked.canceled || picked.assets.length === 0) return null;
  return uploadAsset(picked.assets[0]);
}
