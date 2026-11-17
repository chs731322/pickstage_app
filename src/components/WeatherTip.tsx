import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { useAddChecklistItem, useChecklist } from '@/features/checklist';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { colors, spacing } from '@/theme';
import type { WeatherSummary } from '@/types/api';

// match: 이 글자가 이미 내 체크리스트에 있으면 다시 추가하지 않는다
type TipItem = { content: string; match: string };
type Tip = { message: string; items: TipItem[] };

// 날씨에 맞춰 챙길 것을 고른다. 오늘과 앞으로 며칠 예보를 함께 보고, 비 > 추위 > 더위 > 큰 일교차 순서로 하나만 보여준다.
export function weatherTip(w: Pick<WeatherSummary, 'isRain' | 'tempMin' | 'tempMax' | 'upcoming'>): Tip | null {
  const days = [w, ...w.upcoming];
  const isRain = days.some((d) => d.isRain);
  const mins = days.map((d) => d.tempMin).filter((v): v is number => v != null);
  const maxs = days.map((d) => d.tempMax).filter((v): v is number => v != null);
  const tempMin = mins.length ? Math.min(...mins) : null;
  const tempMax = maxs.length ? Math.max(...maxs) : null;
  if (isRain) {
    return {
      message: '비나 눈 예보가 있어요. 우비와 방수 파우치를 챙겨보세요.',
      items: [
        { content: '우비', match: '우비' },
        { content: '방수 파우치 (휴대폰 보호)', match: '방수' },
      ],
    };
  }
  if (tempMin != null && tempMin <= 5) {
    return {
      message: `최저 ${tempMin}°예요. 핫팩과 따뜻한 겉옷을 챙기세요.`,
      items: [
        { content: '핫팩', match: '핫팩' },
        { content: '두꺼운 겉옷, 목도리', match: '겉옷' },
      ],
    };
  }
  if (tempMax != null && tempMax >= 28) {
    return {
      message: `최고 ${tempMax}°까지 올라요. 쿨링 타월과 휴대용 선풍기를 챙기세요.`,
      items: [{ content: '쿨링 타월, 휴대용 선풍기', match: '쿨링' }],
    };
  }
  if (tempMin != null && tempMax != null && tempMax - tempMin >= 10) {
    return {
      message: `일교차가 ${tempMax - tempMin}°나 돼요. 얇은 겉옷을 챙겨보세요.`,
      items: [{ content: '얇은 겉옷 (일교차 대비)', match: '겉옷' }],
    };
  }
  return null;
}

// 날씨 카드 아래의 한 줄 팁. 로그인했다면 버튼 하나로 내 체크리스트에 추가할 수 있다.
export function WeatherTip({ weather }: { weather: WeatherSummary }) {
  const { isLoggedIn } = useAuth();
  const { data: checklist } = useChecklist();
  const add = useAddChecklistItem();
  const [adding, setAdding] = useState(false);

  const tip = weatherTip(weather);
  if (!tip) return null;

  // 체크리스트를 불러오기 전에는 이미 있는지 알 수 없어서 버튼을 숨긴다
  const missing = checklist ? tip.items.filter((item) => !checklist.some((c) => c.content.includes(item.match))) : [];
  const canAdd = isLoggedIn && checklist != null && missing.length > 0;
  const allAdded = isLoggedIn && checklist != null && missing.length === 0;

  const addAll = async () => {
    setAdding(true);
    try {
      for (const item of missing) await add.mutateAsync(item.content);
    } catch (e) {
      Alert.alert('추가하지 못했어요', errorMessage(e, '잠시 후 다시 시도해주세요.'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <View style={styles.box}>
      <View style={styles.head}>
        <SymbolView name={{ ios: 'lightbulb.fill', android: 'lightbulb', web: 'lightbulb' }} tintColor={colors.brand} size={18} />
        <AppText weight="medium" size={14} color={colors.brandStrong} style={styles.message}>
          {tip.message}
        </AppText>
      </View>

      {canAdd ? (
        <Pressable
          onPress={addAll}
          disabled={adding}
          style={({ pressed }) => [styles.button, pressed && styles.pressed, adding && styles.adding]}
          accessibilityRole="button">
          <AppText weight="bold" size={14} color={colors.white}>
            {adding ? '추가하는 중...' : `체크리스트에 추가하기 (${missing.length}개)`}
          </AppText>
        </Pressable>
      ) : allAdded ? (
        <AppText weight="semibold" size={13} color={colors.brandStrong}>
          ✓ 내 체크리스트에 이미 있어요
        </AppText>
      ) : !isLoggedIn ? (
        <Pressable onPress={() => router.push('/login')} hitSlop={6} accessibilityRole="button">
          <AppText weight="bold" size={13} color={colors.brandStrong}>
            로그인하고 체크리스트에 추가하기 ›
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.sm + 2, padding: spacing.md - 2, borderRadius: 14, backgroundColor: colors.brandSoft },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  message: { flex: 1, lineHeight: 20 },
  button: { alignItems: 'center', paddingVertical: 11, borderRadius: 999, backgroundColor: colors.brand },
  pressed: { backgroundColor: colors.brandStrong },
  adding: { opacity: 0.7 },
});
