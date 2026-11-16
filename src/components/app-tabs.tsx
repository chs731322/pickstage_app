import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors } from '@/theme';

type TabIconProps = { focused: boolean; color: ColorValue };

// 탭 아이콘: iOS는 SF Symbols(선택하면 채워진 모양), 안드로이드·웹은 Material Symbols
function icon(ios: { off: string; on: string }, material: string) {
  return function TabIcon({ focused, color }: TabIconProps) {
    return (
      <SymbolView
        name={{ ios: (focused ? ios.on : ios.off) as never, android: material as never, web: material as never }}
        weight={focused ? 'semibold' : 'regular'}
        tintColor={color}
        size={24}
      />
    );
  };
}

// 선택한 탭은 글자가 굵어진다 (글꼴 굵기는 labelStyle로 바꿀 수 없어서 글자를 직접 그린다)
function label(title: string) {
  return function TabLabel({ focused, color }: TabIconProps) {
    return (
      <AppText weight={focused ? 'bold' : 'medium'} size={11} color={color}>
        {title}
      </AppText>
    );
  };
}

// 아이콘 24 + 글자 11 + 위아래 여백이 들어가는 높이 (아래쪽 안전 영역 제외)
const TAB_BAR_HEIGHT = 58;

// 하단 탭바: 화면 아래에 꽉 차게 붙은 평평한 모양 (아이콘 아래에 글자).
// 탭 이름(name)은 src/app/(tabs)/ 폴더의 파일 이름과 같아야 한다.
export default function AppTabs() {
  // 높이를 직접 정하면 아이폰의 아래쪽 막대(홈 인디케이터) 영역은 자동으로 더해지지 않아서, 직접 더한다
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: [styles.bar, { height: TAB_BAR_HEIGHT + bottom, paddingBottom: bottom }],
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: icon({ off: 'house', on: 'house.fill' }, 'home'),
          tabBarLabel: label('홈'),
        }}
      />
      <Tabs.Screen
        name="performances"
        options={{
          tabBarIcon: icon({ off: 'ticket', on: 'ticket.fill' }, 'confirmation_number'),
          tabBarLabel: label('공연'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: icon({ off: 'calendar', on: 'calendar' }, 'calendar_month'),
          tabBarLabel: label('캘린더'),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: icon(
            { off: 'bubble.left.and.bubble.right', on: 'bubble.left.and.bubble.right.fill' },
            'forum',
          ),
          tabBarLabel: label('커뮤니티'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          tabBarIcon: icon({ off: 'person', on: 'person.fill' }, 'person'),
          tabBarLabel: label('마이'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    // 그림자 없이 평평하게 (위쪽 얇은 선만)
    elevation: 0,
    shadowOpacity: 0,
  },
});
