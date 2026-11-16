// 서버 응답 공통 모양과, 화면들이 함께 쓰는 자료형

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

export type User = {
  id: number;
  email: string;
  nickname: string;
  profileImage: string | null;
  role: 'user' | 'admin';
};

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: User;
};

// GET /api/weather/summary
export type WeatherDay = {
  date: string; // YYYY-MM-DD
  dayOffset: number;
  tempMin: number | null;
  tempMax: number | null;
  sky: string | null;
  isRain: boolean;
};

export type WeatherSummary = WeatherDay & {
  source: 'short' | 'mid';
  upcoming: WeatherDay[];
};
