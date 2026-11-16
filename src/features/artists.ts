import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

// 아티스트 상세의 공연 한 줄 (예정된 공연 / 출연했던 공연)
export type ArtistConcert = {
  id: number;
  title: string;
  posterImage: string | null;
  startDate: string | null;
  endDate: string | null;
  region: string | null;
  venueName: string | null;
};

export type ArtistDetail = {
  id: number;
  name: string;
  englishName: string | null;
  artistType: string | null;
  profileImage: string | null;
  genre: string | null;
  genreTags: string[] | null;
  countryCode: string | null;
  officialUrl: string | null;
  instagramUrl: string | null;
  spotifyUrl: string | null;
  description: string | null;
  upcomingConcerts: ArtistConcert[] | null;
  pastConcerts: ArtistConcert[] | null;
};

export function useArtist(id: string | undefined) {
  return useQuery({
    queryKey: ['artist', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<ArtistDetail>>(`/api/artists/${id}`);
      return res.data.data;
    },
  });
}

export type InterestedArtist = { id: number; name: string; profileImage: string | null; genre: string | null };

// 내 관심 아티스트 (로그인했을 때만)
export function useInterestedArtists() {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['artists', 'interests'],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await api.get<ApiResponse<InterestedArtist[]>>('/api/artists/interests');
      return res.data.data ?? [];
    },
  });
}

// 관심 아티스트 추가/삭제. 이미 추가된 경우(409)는 추가된 상태로 맞춘다.
export function useToggleFavoriteArtist(artistId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      if (isFavorite) {
        await api.delete(`/api/artists/${artistId}`);
      } else {
        await api.post(`/api/artists/${artistId}`);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['artists', 'interests'] }),
  });
}
