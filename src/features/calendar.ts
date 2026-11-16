import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { CalendarFestival } from '@/lib/calendar';
import type { ApiResponse } from '@/types/api';

// 그 달에 진행되는 공연 (month는 1~12). 날짜가 없는 공연은 서버가 주지 않는다.
export function useCalendarFestivals(year: number, month: number) {
  return useQuery({
    queryKey: ['calendar', year, month],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CalendarFestival[]>>('/api/festivals/calendar', { params: { year, month } });
      return (res.data.data ?? []).filter((f) => f.startDate && f.endDate);
    },
    staleTime: 5 * 60_000,
  });
}
