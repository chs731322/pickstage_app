import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { colors } from '@/theme';

// 제목 속 핵심 단어를 형광펜으로 칠한 것처럼 강조한다 (글꼴·크기·색은 바깥 글자를 그대로 따른다)
export function Highlight({ children, color = colors.brandTint }: { children: ReactNode; color?: string }) {
  return <Text style={{ backgroundColor: color }}>{children}</Text>;
}
