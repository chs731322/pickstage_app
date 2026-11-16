import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function FestivalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen>
      <Placeholder title={`공연 #${id}`} note="공연 상세 화면은 이어서 만들어요." />
    </Screen>
  );
}
