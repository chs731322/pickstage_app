import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { errorMessage } from '@/lib/api';
import { isPushSupported, PushError, sendTestPush } from '@/lib/push';
import { usePushSettings } from '@/lib/usePushSettings';
import { colors, radius, spacing } from '@/theme';

const KINDS = [
  { icon: { ios: 'ticket', android: 'confirmation_number', web: 'confirmation_number' }, title: '티켓 오픈', desc: '찜한 공연의 티켓이 열릴 때 알려드려요. (공연 상세에서 찜할 때 "티켓 오픈 알림"을 켠 공연)' },
  { icon: { ios: 'music.note', android: 'music_note', web: 'music_note' }, title: '공연 당일', desc: '찜한 공연 당일 아침에 챙길 것과 함께 알려드려요.' },
  { icon: { ios: 'bell', android: 'notifications', web: 'notifications' }, title: '내가 예약한 알림', desc: '공연 상세에서 직접 정한 시각에 알려드려요.' },
  { icon: { ios: 'bubble.left', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }, title: '댓글', desc: '내 글에 댓글이 달리면 알려드려요.' },
] as const;

// 푸시 알림 설정: 이 기기로 푸시를 받을지 켜고 끄고, 받는 알림의 종류를 확인하고, 테스트 알림을 보낸다
export default function PushSettingsScreen() {
  const { permission, enabled, registered, busy, turnOn, turnOff } = usePushSettings();
  const [testing, setTesting] = useState(false);

  const handleToggle = async (next: boolean) => {
    try {
      if (next) await turnOn();
      else await turnOff();
    } catch (error) {
      Alert.alert('설정하지 못했어요', error instanceof PushError ? error.message : errorMessage(error, '잠시 후 다시 시도해주세요.'));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await sendTestPush();
      Alert.alert('테스트 알림을 보냈어요', '잠시 뒤 이 기기로 알림이 도착해요. 앱을 나가서 홈 화면에서 확인해보세요.');
    } catch (error) {
      Alert.alert('보내지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요. (테스트 알림은 1분에 한 번만 보낼 수 있어요)'));
    } finally {
      setTesting(false);
    }
  };

  const denied = permission === 'denied';

  return (
    <Screen topInset={false}>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <AppText weight="bold" size={18}>
              이 기기로 푸시 알림 받기
            </AppText>
            <AppText size={14} color={colors.textSecondary} style={styles.desc}>
              {!isPushSupported
                ? Platform.OS === 'web'
                  ? '푸시 알림은 폰 앱에서만 쓸 수 있어요.'
                  : '푸시 알림은 실제 폰에서만 쓸 수 있어요. (시뮬레이터에서는 사용할 수 없어요)'
                : enabled
                  ? '켜져 있어요. 아래 알림이 이 기기로 도착해요.'
                  : '꺼져 있어요. 켜면 알림이 이 기기로 바로 도착해요.'}
            </AppText>
          </View>
          <Switch
            value={enabled && permission === 'granted'}
            onValueChange={handleToggle}
            disabled={busy || !isPushSupported}
            trackColor={{ true: colors.brand }}
            thumbColor={colors.white}
          />
        </View>

        {denied && isPushSupported ? (
          <View style={styles.warn}>
            <AppText size={14} color={colors.danger} style={styles.desc}>
              이 기기에서 PICKSTAGE의 알림이 꺼져 있어요. 설정에서 알림을 허용해야 푸시를 받을 수 있어요.
            </AppText>
            <Button title="설정 열기" variant="secondary" onPress={() => Linking.openSettings()} />
          </View>
        ) : null}
      </View>

      {/* 알림 종류 */}
      <View style={styles.card}>
        <AppText weight="bold" size={18}>
          받는 알림
        </AppText>
        {KINDS.map((kind) => (
          <View key={kind.title} style={styles.kind}>
            <View style={styles.kindIcon}>
              <SymbolView name={kind.icon as never} tintColor={colors.brand} size={20} />
            </View>
            <View style={styles.flex}>
              <AppText weight="bold" size={16}>
                {kind.title}
              </AppText>
              <AppText size={14} color={colors.textSecondary} style={styles.desc}>
                {kind.desc}
              </AppText>
            </View>
          </View>
        ))}
        <AppText size={13} color={colors.textMuted}>
          푸시를 꺼도 앱 안의 알림 목록에는 계속 쌓여요.
        </AppText>
      </View>

      {/* 테스트 */}
      {isPushSupported && registered && enabled && permission === 'granted' ? (
        <View style={styles.card}>
          <AppText weight="bold" size={18}>
            테스트 알림
          </AppText>
          <AppText size={14} color={colors.textSecondary} style={styles.desc}>
            이 기기로 테스트 알림을 보내서 잘 오는지 확인해요. 1분에 한 번만 보낼 수 있어요.
          </AppText>
          <Button title="테스트 알림 보내기" variant="secondary" onPress={handleTest} loading={testing} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  desc: { lineHeight: 21, marginTop: 2 },
  warn: { gap: spacing.sm },
  kind: { flexDirection: 'row', gap: spacing.md },
  kindIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
});
