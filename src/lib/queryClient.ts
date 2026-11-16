import { QueryClient } from '@tanstack/react-query';

// 서버 데이터를 화면 사이에서 보관·재사용한다.
// 1분 안에 같은 데이터를 다시 열면 서버를 다시 부르지 않고, 실패하면 한 번만 다시 시도한다.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});
