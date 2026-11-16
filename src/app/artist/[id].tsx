import { useLocalSearchParams } from 'expo-router';

import { Placeholder } from '@/components/Placeholder';
import { Screen } from '@/components/Screen';

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen topInset={false}>
      <Placeholder title={`아티스트 #${id}`} />
    </Screen>
  );
}
