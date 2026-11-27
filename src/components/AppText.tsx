import { Text, type ColorValue, type TextProps } from 'react-native';

import { colors, fontFamily, type TextSize } from '@/theme';

type Props = TextProps & {
  weight?: keyof typeof fontFamily;
  // 정해둔 6단계 중에서만 고른다 (theme 의 TextSize)
  size?: TextSize;
  color?: ColorValue;
};

// 앱 전체에서 쓰는 글자. Pretendard 굵기를 weight로 고른다 (fontWeight는 쓰지 않는다).
export function AppText({ weight = 'regular', size = 14, color = colors.text, style, ...props }: Props) {
  return <Text {...props} style={[{ fontFamily: fontFamily[weight], fontSize: size, color }, style]} />;
}
