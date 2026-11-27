import { Tabs } from 'expo-router';
import { Image, Platform, StyleSheet, useWindowDimensions, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, MAX_FONT_SCALE } from '@/theme';

type TabIconProps = { focused: boolean; color: ColorValue };

// 탭 아이콘: 다섯 개를 같은 선 두께로 직접 그린 그림. 선택하면 모양은 그대로 두고 색만 바뀐다.
const TAB_ICONS = {
  home: require('../../assets/images/tab/home.png'),
  ticket: require('../../assets/images/tab/ticket.png'),
  calendar: require('../../assets/images/tab/calendar.png'),
  community: require('../../assets/images/tab/community.png'),
  profile: require('../../assets/images/tab/profile.png'),
};

function icon(name: keyof typeof TAB_ICONS) {
  return function TabIcon({ color }: TabIconProps) {
    return <Image source={TAB_ICONS[name]} style={[styles.icon, { tintColor: color }]} />;
  };
}

// 선택한 탭은 글자가 굵어진다 (글꼴 굵기는 labelStyle로 바꿀 수 없어서 글자를 직접 그린다)
function label(title: string) {
  return function TabLabel({ focused, color }: TabIconProps) {
    return (
      <AppText weight={focused ? 'bold' : 'medium'} size={12} color={color}>
        {title}
      </AppText>
    );
  };
}

// 아이콘 24 + 글자 12 + 위아래 여백이 들어가는 높이 (아래쪽 안전 영역 제외)
export const TAB_BAR_HEIGHT = 54;

// 탭바 아래에 비워둘 높이. 아이폰의 안전 영역(34)을 그대로 비우면 글자 밑이 휑해서 12만큼 줄인다 (홈 막대와는 겹치지 않는다).
// 안드로이드는 시스템 버튼과 겹칠 수 있어 그대로 둔다.
export function tabBarInset(bottom: number) {
  return Platform.OS === 'ios' && bottom > 0 ? bottom - 12 : bottom;
}

// 하단 탭바: 화면 아래에 꽉 차게 붙은 평평한 모양 (아이콘 아래에 글자).
// 탭 이름(name)은 src/app/(tabs)/ 폴더의 파일 이름과 같아야 한다.
export default function AppTabs() {
  // 높이를 직접 정하면 아이폰의 아래쪽 막대(홈 인디케이터) 영역은 자동으로 더해지지 않아서, 직접 더한다
  const bottom = tabBarInset(useSafeAreaInsets().bottom);
  // 글자를 키운 폰에서는 탭 이름이 잘리지 않게 늘어난 만큼 높인다
  const { fontScale } = useWindowDimensions();
  const grow = Math.round(16 * (Math.min(Math.max(fontScale, 1), MAX_FONT_SCALE) - 1));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: [styles.bar, { height: TAB_BAR_HEIGHT + grow + bottom, paddingBottom: bottom }],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: icon('home'),
          tabBarLabel: label('홈'),
        }}
      />
      <Tabs.Screen
        name="performances"
        options={{
          tabBarIcon: icon('ticket'),
          tabBarLabel: label('공연'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: icon('calendar'),
          tabBarLabel: label('캘린더'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: icon('community'),
          tabBarLabel: label('커뮤니티'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: icon('profile'),
          tabBarLabel: label('프로필'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 24, height: 24 },
  bar: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    // 그림자 없이 평평하게 (위쪽 얇은 선만)
    elevation: 0,
    shadowOpacity: 0,
  },
});
