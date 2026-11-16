import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { ApiResponse } from '@/types/api';

// 공연 목록 한 줄 (GET /api/festivals 의 content 항목)
export type FestivalSummary = {
  id: number;
  title: string;
  posterImage: string | null;
  startDate: string;
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
  genre?: string;
  outdoor?: boolean;
  upcomingOnly?: boolean;
  size?: number;
  page?: number;
};

export async function fetchFestivals(query: FestivalQuery): Promise<FestivalSummary[]> {
  const res = await api.get<ApiResponse<FestivalPage>>('/api/festivals', { params: query });
  return res.data.data.content ?? [];
}

// 지금 인기 있는 예정 공연 (홈 맨 위 포스터)
export function usePopularFestivals(size = 5) {
  return useQuery({
    queryKey: ['festivals', 'popular', size],
    queryFn: () => fetchFestivals({ sort: 'popular', size, upcomingOnly: true }),
  });
}

// 티켓이 곧 열리는 공연 (임박순). 하나도 없으면 가장 최근에 열린 것 하나를 대신 보여준다.
export function useTicketOpenFestivals(size = 6) {
  return useQuery({
    queryKey: ['festivals', 'ticket-open', size],
    queryFn: async () => {
      let list = await fetchFestivals({ sort: 'ticket_open', size, upcomingOnly: true });
      if (list.length === 0) {
        list = await fetchFestivals({ sort: 'ticket_open_recent', size: 1, upcomingOnly: true });
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
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
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
