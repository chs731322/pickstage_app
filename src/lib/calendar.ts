// 캘린더 계산 (웹 MonthCalendarSection.jsx 와 같은 규칙): 날짜 칸 만들기, 며칠짜리 공연의 줄·색 정하기

export type CalendarFestival = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  region: string | null;
  posterImage: string | null;
  venueName: string | null;
};

export type CalendarDay = { day: number; dateStr: string; festivals: CalendarFestival[] };

// 서로 구분되는 파스텔 색 (배경 / 글자)
export const PASTELS: [string, string][] = [
  ['#ffd9e6', '#a8335f'],
  ['#d9e8ff', '#2c5aa0'],
  ['#dcf3dd', '#2b7a4b'],
  ['#fff0c7', '#8a6a00'],
  ['#e6dcff', '#5a44ae'],
  ['#d5f2f0', '#1e7872'],
  ['#ffe2d3', '#a1461e'],
  ['#f1dff7', '#84409a'],
  ['#e5f1c8', '#53701a'],
  ['#d6e9f3', '#2a6583'],
];

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

// 한 달 동안 각 공연에 줄 번호(slot)와 색을 정해 둔다. 며칠에 걸친 공연이 날짜가 바뀌어도 같은 줄·같은 색으로 보이게 한다.
export function buildLayout(festivals: CalendarFestival[]) {
  const sorted = [...festivals].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate) || a.id - b.id,
  );
  const slotEnds: string[] = [];
  const slotById: Record<number, number> = {};
  const colorById: Record<number, [string, string]> = {};
  sorted.forEach((f, index) => {
    let slot = slotEnds.findIndex((end) => end < f.startDate);
    if (slot === -1) slot = slotEnds.length;
    slotEnds[slot] = f.endDate;
    slotById[f.id] = slot;
    colorById[f.id] = PASTELS[index % PASTELS.length];
  });
  return { slotById, colorById };
}

// 그 달의 주(7칸씩) 배열. 월요일부터 시작하고(웹과 같다), 달 밖의 칸은 null.
export function buildWeeks(year: number, month: number, festivals: CalendarFestival[]): (CalendarDay | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;

  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d += 1) {
    const dateStr = toDateStr(year, month, d);
    days.push({ day: d, dateStr, festivals: festivals.filter((f) => f.startDate <= dateStr && dateStr <= f.endDate) });
  }

  const totalWeeks = Math.ceil((firstWeekday + daysInMonth) / 7);
  const weeks: (CalendarDay | null)[][] = [];
  for (let w = 0; w < totalWeeks; w += 1) {
    const week: (CalendarDay | null)[] = [];
    for (let i = 0; i < 7; i += 1) {
      const offset = w * 7 + i - firstWeekday;
      week.push(offset >= 0 && offset < daysInMonth ? days[offset] : null);
    }
    weeks.push(week);
  }
  return weeks;
}
