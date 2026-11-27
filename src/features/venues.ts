import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FestivalDetail } from '@/features/festivals';
import { api } from '@/lib/api';
import { nameGroupOf } from '@/lib/koreanGroup';
import type { ApiResponse } from '@/types/api';

export type VenueReview = {
  id: number;
  authorId: number | null;
  nickname: string;
  rating: number;
  content: string;
  viewInfo: string | null;
  standingTip: string | null;
  seatSection: string | null;
  createdAt: string | null;
  images: string[] | null;
};

export type VenueDetail = {
  id: number;
  name: string;
  address: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  transportInfo: string | null;
  facilities: string | null;
  images: { id: number; imageUrl: string; imageType: string | null; sortOrder: number; credit: string | null }[] | null;
  upcomingConcerts: { id: number; title: string; startDate: string | null }[] | null;
  reviews: VenueReview[] | null;
};

export function useVenue(id: string | undefined) {
  return useQuery({
    queryKey: ['venue', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await api.get<ApiResponse<VenueDetail>>(`/api/venues/${id}`);
      return res.data.data;
    },
  });
}

// 공연장의 예정 공연에는 포스터가 없어서, 공연 상세에서 포스터·장르·종료일을 가져온다 (웹과 같은 방식)
export function useVenueConcertDetails(concertIds: number[]) {
  return useQueries({
    queries: concertIds.map((id) => ({
      queryKey: ['festival', String(id)],
      queryFn: async () => {
        const res = await api.get<ApiResponse<FestivalDetail>>(`/api/festivals/${id}`);
        return res.data.data;
      },
      staleTime: 5 * 60_000,
    })),
  });
}

export type ReviewInput = {
  venueId: number;
  rating: number;
  content: string;
  viewInfo?: string;
  standingTip?: string;
  seatSection?: string;
};

// 공연장 후기 작성 (사진은 아직 지원하지 않는다)
export function useCreateReview(venueId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      await api.post('/api/reviews', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewHighlights', 'venue', venueId] });
      return queryClient.invalidateQueries({ queryKey: ['venue', String(venueId)] });
    },
  });
}

// 서버의 facilities는 JSON 문자열이다: {"cafe":false,"phone":"02-...","parking":true,"accessible":{"ramp":true,...},...}
export type VenueFacilities = { phone: string | null; homepage: string | null; available: string[] };

const FACILITY_LABEL: Record<string, string> = {
  parking: '주차장',
  cafe: '카페',
  restaurant: '식당',
  store: '매점',
  playroom: '놀이방',
  nursingRoom: '수유실',
};
const ACCESSIBLE_LABEL: Record<string, string> = {
  ramp: '경사로',
  parking: '장애인 주차',
  elevator: '엘리베이터',
  restroom: '장애인 화장실',
};

// 읽을 수 없는 값이면 null (그때는 화면이 원문을 그대로 보여준다)
export function parseFacilities(raw: string | null): VenueFacilities | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (typeof data !== 'object' || data === null) return null;
    const accessible = (data.accessible ?? {}) as Record<string, unknown>;
    return {
      phone: typeof data.phone === 'string' && data.phone ? data.phone : null,
      homepage: typeof data.homepage === 'string' && data.homepage ? data.homepage : null,
      available: [
        ...Object.keys(FACILITY_LABEL).filter((key) => data[key] === true).map((key) => FACILITY_LABEL[key]),
        ...Object.keys(ACCESSIBLE_LABEL).filter((key) => accessible[key] === true).map((key) => ACCESSIBLE_LABEL[key]),
      ],
    };
  } catch {
    return null;
  }
}

// ───── 공연장 목록 ─────

export type VenueListItem = { id: number; name: string; address: string | null; region: string | null; image: string | null };

export const VENUE_REGIONS = ['전체', '서울', '인천', '경기', '부산', '강원'] as const;

const collator = new Intl.Collator('ko');

// 공연장을 한 번에 모두 받아 가나다순으로 정렬한다 (웹과 같은 방식. 전국 100곳 안팎이라 한 번에 받아도 가볍다)
export function useVenueList(region: string) {
  return useQuery({
    queryKey: ['venues', 'list', region],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ content: VenueListItem[] }>>('/api/venues', {
        params: { region: region === '전체' ? undefined : region, size: 300 },
      });
      return [...(res.data.data.content ?? [])].sort((a, b) => collator.compare(a.name, b.name));
    },
  });
}

export const venueGroupOf = nameGroupOf;
