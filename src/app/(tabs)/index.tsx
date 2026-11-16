import { AppText } from '@/components/AppText';
import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';
import { WeatherCard } from '@/components/WeatherCard';
import { colors } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <AppText weight="extrabold" size={26} color={colors.brand}>
        PICKSTAGE
      </AppText>
      <WeatherCard />
      <Placeholder title="인기 공연" note="공연 목록을 연결하면 여기에 보여요." />
      <Placeholder title="티켓 오픈 일정" />
      <Placeholder title="내 취향 공연" note="로그인하고 관심 아티스트를 고르면 추천해드려요." />
    </Screen>
  );
}
