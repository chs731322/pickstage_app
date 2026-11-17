import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ApiResponse } from '@/types/api';

// 공연 목록 한 줄 (GET /api/festivals 의 content 항목)
export type FestivalSummary = {
  id: number;
  title: string;
  posterImage: string | null;
  // 날짜가 아직 정해지지 않은 공연은 null
  startDate: string | null;
  endDate: string | null;
  region: string | null;
  genre: string | null;
  isFestival: boolean;
  venueName: string | null;
  bookmarkCount: number;
  ticketOpenAt: string | null;
  ticketLabel: string | null;
};

type FestivalPage = { content: FestivalSummary[]; page: number; totalElements: number; totalPages: number };

type FestivalQuery = {
  sort?: 'popular' | 'start' | 'ticket_open' | 'ticket_open_recent';
  region?: string;
  keyword?: string;
  genre?: string;
  outdoor?: boolean;
  upcomingOnly?: boolean;
  size?: number;
  page?: number;
};

async function fetchFestivalPage(query: FestivalQuery): Promise<FestivalPage> {
  const res = await api.get<ApiResponse<FestivalPage>>('/api/festivals', { params: query });
  return res.data.data;
}

export async function fetchFestivals(query: FestivalQuery): Promise<FestivalSummary[]> {
  return (await fetchFestivalPage(query)).content ?? [];
}

// ───── 공연 탐색 (공연 탭) ─────

export const LIST_SORTS = [
  { id: 'popular', label: '인기순' },
  { id: 'start', label: '임박순' },
  { id: 'ticket_open', label: '티켓 오픈순' },
] as const;
export type ListSort = (typeof LIST_SORTS)[number]['id'];

export const LIST_REGIONS = ['전체', '서울', '인천', '경기', '부산', '강원'] as const;
// 서버에 저장된 공연 장르 코드 (화면 이름은 festivalGenreLabel)
export const LIST_GENRES = ['indie_band', 'rock', 'hiphop', 'jazz', 'edm', 'general_music'] as const;

export type ListFilters = { sort: ListSort; region: string; genre: string; keyword: string };

const LIST_PAGE_SIZE = 12;

// 필터가 바뀌면 처음부터, 스크롤을 내리면 다음 페이지를 이어서 불러온다
export function useFestivalList(filters: ListFilters) {
  return useInfiniteQuery({
    queryKey: ['festivals', 'list', filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const query: FestivalQuery = {
        sort: filters.sort,
        region: filters.region === '전체' ? undefined : filters.region,
        genre: filters.genre || undefined,
        keyword: filters.keyword.trim() || undefined,
        page: pageParam,
        size: LIST_PAGE_SIZE,
      };
      let result = await fetchFestivalPage(query);
      // 앞으로 열릴 티켓이 하나도 없으면 최근에 오픈한 순으로 대신 보여준다 (웹과 같은 기준)
      if (filters.sort === 'ticket_open' && pageParam === 0 && (result.totalElements ?? 0) === 0) {
        result = await fetchFestivalPage({ ...query, sort: 'ticket_open_recent' });
      }
      return result;
    },
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

// ───── 공연 상세 ─────

export type FestivalDetail = {
  id: number;
  title: string;
  posterImage: string | null;
  images: string[] | null;
  startDate: string | null;
  endDate: string | null;
  region: string | null;
  genre: string | null;
  isFestival: boolean;
  description: string | null;
  ticketOpenAt: string | null;
  ticketLink: string | null;
  externalUrl: string | null;
  viewCount: number;
  bookmarkCount: number;
  venue: { id: number; name: string; address: string | null; latitude: number | null; longitude: number | null } | null;
  artists: { id: number; name: string; profileImage: string | null; isHeadliner: boolean; performanceDate: string | null }[] | null;
  tickets: { label: string; vendorName: string | null; price: number | null; bookingUrl: string | null; openAt: string | null }[] | null;
};

export function useFestival(id: string | undefined) {
  return useQuery({
    queryKey: ['festival', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<FestivalDetail>>(`/api/festivals/${id}`);
      return res.data.data;
    },
  });
}

// 같은 장르의 다른 공연 (상세 맨 아래 "함께 볼만한 공연")
export function useRelatedFestivals(festival: FestivalDetail | undefined) {
  return useQuery({
    queryKey: ['festivals', 'related', festival?.id],
    enabled: Boolean(festival?.genre),
    queryFn: async () => {
      const list = await fetchFestivals({ genre: festival!.genre!, size: 5, upcomingOnly: true });
      return list.filter((item) => item.id !== festival!.id).slice(0, 4);
    },
  });
}

// 지금 인기 있는 예정 공연 (홈 맨 위 포스터)
export function usePopularFestivals(size = 5) {
  return useQuery({
    queryKey: ['festivals', 'popular', size],
    queryFn: () => fetchFestivals({ sort: 'popular', size, upcomingOnly: true }),
  });
}

// 티켓이 곧 열리는 공연 (임박순). 하나도 없으면 최근에 열린 공연들을 대신 보여준다.
export function useTicketOpenFestivals(size = 6) {
  return useQuery({
    queryKey: ['festivals', 'ticket-open', size],
    queryFn: async () => {
      let list = await fetchFestivals({ sort: 'ticket_open', size, upcomingOnly: true });
      if (list.length === 0) {
        list = await fetchFestivals({ sort: 'ticket_open_recent', size, upcomingOnly: true });
      }
      return list.filter((item) => item.ticketOpenAt);
    },
  });
}

// 기분별 탭 (웹 MoodFilterSection 과 같은 조건): 탭 하나가 여러 조회를 합쳐 보여줄 수 있다
export const MOOD_TABS = [
  { id: 'indie', label: '혼자 즐기기', queries: [{ genre: 'indie_band' }] },
  { id: 'outdoor', label: '야외에서 낭만 있게', queries: [{ genre: 'jazz' }, { outdoor: true }] },
  { id: 'jump', label: '뛰어보자', queries: [{ genre: 'rock,hiphop,edm' }] },
] as const satisfies readonly { id: string; label: string; queries: readonly FestivalQuery[] }[];

export type MoodId = (typeof MOOD_TABS)[number]['id'];

const MOOD_COUNT = 8;

// 여러 조회 결과를 합쳐 중복을 없애고, 시작이 임박한 순으로 몇 개만 남긴다
function mergeFestivals(results: FestivalSummary[][]): FestivalSummary[] {
  const byId = new Map<number, FestivalSummary>();
  results.flat().forEach((festival) => byId.set(festival.id, festival));
  return [...byId.values()]
    .sort((a, b) => (a.startDate ?? '9999').localeCompare(b.startDate ?? '9999') || a.id - b.id)
    .slice(0, MOOD_COUNT);
}

export function useMoodFestivals(mood: MoodId) {
  return useQuery({
    queryKey: ['festivals', 'mood', mood],
    queryFn: async () => {
      const tab = MOOD_TABS.find((t) => t.id === mood)!;
      const results = await Promise.all(
        tab.queries.map((q) => fetchFestivals({ ...q, sort: 'start', size: MOOD_COUNT * 2, upcomingOnly: true })),
      );
      return mergeFestivals(results);
    },
  });
}

// ───── 내 취향 공연 (관심 아티스트가 라인업에 있는 예정 공연, 로그인 필요) ─────

export type RecommendedFestival = {
  id: number;
  title: string;
  posterImage: string | null;
  startDate: string | null;
  endDate: string | null;
  region: string | null;
  genre: string | null;
  venueName: string | null;
  matchedArtists: string[] | null;
  matchCount: number;
};

export function useRecommendedFestivals(size = 4) {
  const { isLoggedIn } = useAuth();
  return useQuery({
    queryKey: ['festivals', 'recommended', size, isLoggedIn],
    enabled: isLoggedIn,
    queryFn: async () => {
      const res = await api.get<ApiResponse<RecommendedFestival[]>>('/api/festivals/recommendations', { params: { page: 0, size } });
      return res.data.data ?? [];
    },
  });
}
