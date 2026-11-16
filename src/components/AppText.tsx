import { Text, type TextProps } from 'react-native';

import { colors, fontFamily } from '@/theme';

type Props = TextProps & {
  weight?: keyof typeof fontFamily;
  size?: number;
  color?: string;
};

// 앱 전체에서 쓰는 글자. Pretendard 굵기를 weight로 고른다 (fontWeight는 쓰지 않는다).
export function AppText({ weight = 'regular', size = 15, color = colors.text, style, ...props }: Props) {
  return <Text {...props} style={[{ fontFamily: fontFamily[weight], fontSize: size, color }, style]} />;
}
