// 날짜 같은 값을 화면에 보여줄 한국어 문구로 바꾼다 (웹 frontend/src 의 같은 이름 함수들과 같은 규칙)

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const pad = (n: number) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' -> 그 날 자정 (브라우저·폰의 시간대 기준)
function parseDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 공연 기간: 하루면 '2026.11.22', 여러 날이면 '2026.11.20 ~ 2026.11.22', 날짜가 없으면 '일정 미정'
export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '일정 미정';
  const s = start.slice(0, 10).replaceAll('-', '.');
  if (!end || end === start) return s;
  return `${s} ~ ${end.slice(0, 10).replaceAll('-', '.')}`;
}

// 티켓 오픈 시각: '10.13(화) 18:00'
export function formatOpenAt(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}(${WEEKDAYS[d.getDay()]}) ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 오늘부터 며칠 남았는지 (오늘이면 0, 지났으면 음수)
export function daysUntil(value: string | null): number | null {
  if (!value) return null;
  const target = value.length > 10 ? new Date(value) : parseDate(value);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// 티켓 오픈 표시: 이미 열렸으면 'OPEN', 아니면 'D-3'
export function ticketDDay(openAt: string | null): string {
  const days = daysUntil(openAt);
  if (days === null) return '-';
  return days <= 0 ? 'OPEN' : `D-${days}`;
}

// 공연의 진행 상태 표시: 끝났으면 '종료', 시작했고 아직 안 끝났으면 '진행 중', 아니면 'D-3'(당일은 'D-DAY')
// 날짜가 정해지지 않은 공연은 null (표시하지 않는다)
export type FestivalStatus = { label: string; kind: 'ended' | 'live' | 'soon' };

export function festivalStatus(start: string | null, end: string | null): FestivalStatus | null {
  if (!start) return null;
  const untilStart = daysUntil(start);
  const untilEnd = daysUntil(end ?? start);
  if (untilStart === null || untilEnd === null) return null;
  if (untilEnd < 0) return { label: '종료', kind: 'ended' };
  if (untilStart < 0) return { label: '진행 중', kind: 'live' };
  if (untilStart === 0) return { label: 'D-DAY', kind: 'soon' };
  return { label: `D-${untilStart}`, kind: 'soon' };
}
