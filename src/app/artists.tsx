import { useHeaderHeight } from 'expo-router/react-navigation';
import { Platform } from 'react-native';

import { ArtistList } from '@/components/lists/ArtistList';
import { spacing } from '@/theme';

// 아티스트 찾기 (다른 화면에서 들어오는 경로). 공연 목록 탭의 제목에서도 같은 목록을 본다.
export default function Screen() {
  const headerHeight = useHeaderHeight();
  return <ArtistList topPadding={spacing.md + (Platform.OS === 'ios' ? headerHeight : 0)} />;
}
