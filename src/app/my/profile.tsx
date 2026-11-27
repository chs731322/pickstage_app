import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { MenuCard, MenuRow } from '@/components/MenuRow';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { pickAndUploadProfileImage } from '@/features/community';
import {
  usePrivacy,
  useUpdateNickname,
  useUpdatePrivacy,
  useUpdateProfileImage,
  withdrawAccount,
  type Privacy,
} from '@/features/me';
import { errorMessage } from '@/lib/api';
import { checkNicknameAvailable } from '@/lib/authApi';
import { useAuth } from '@/lib/auth';
import { isValidNickname } from '@/lib/validation';
import { colors, radius, spacing } from '@/theme';

const PRIVACY_ITEMS: { key: keyof Privacy; label: string }[] = [
  { key: 'showBookmarks', label: '찜한 공연' },
  { key: 'showArtists', label: '관심 아티스트' },
  { key: 'showPosts', label: '내가 쓴 글' },
  { key: 'showReviews', label: '공연장 후기' },
];

// 회원정보: 닉네임 변경, 비밀번호 변경, 프로필 공개 설정, 회원 탈퇴
export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const updateNickname = useUpdateNickname();
  const { data: privacy } = usePrivacy();
  const updatePrivacy = useUpdatePrivacy();
  const updateImage = useUpdateProfileImage();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [nickname, setNickname] = useState(user?.nickname ?? '');
  // 바꾼 닉네임이 사용 가능한지 확인한 결과 (바꾸기 전에는 null)
  const [check, setCheck] = useState<{ nickname: string; ok: boolean; message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  if (!user) return null;

  const trimmed = nickname.trim();
  const changed = trimmed !== user.nickname;
  const checkedOk = check?.nickname === trimmed && check.ok;
  const nicknameInvalid = changed && !isValidNickname(trimmed);

  const savePhoto = (imageUrl: string) =>
    updateImage.mutate(imageUrl, {
      onSuccess: () => Alert.alert(imageUrl ? '프로필 사진을 바꿨어요' : '기본 이미지로 바꿨어요'),
      onError: (error) => Alert.alert('사진을 바꾸지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.')),
    });

  const choosePhoto = async () => {
    setUploadingPhoto(true);
    try {
      const url = await pickAndUploadProfileImage();
      if (url) savePhoto(url);
    } catch (error) {
      Alert.alert('사진을 올리지 못했어요', error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 사진을 누르면: 사진 고르기 / 기본 이미지로 / 취소
  const openPhotoMenu = () =>
    Alert.alert('프로필 사진', undefined, [
      { text: '앨범에서 고르기', onPress: choosePhoto },
      ...(user.profileImage ? [{ text: '기본 이미지로', style: 'destructive' as const, onPress: () => savePhoto('') }] : []),
      { text: '취소', style: 'cancel' as const },
    ]);

  const handleCheck = async () => {
    if (!isValidNickname(trimmed)) return;
    setChecking(true);
    try {
      const result = await checkNicknameAvailable(trimmed);
      setCheck({ nickname: trimmed, ok: result.available, message: result.message });
    } catch (error) {
      setCheck({ nickname: trimmed, ok: false, message: errorMessage(error, '확인하지 못했어요. 잠시 후 다시 시도해주세요.') });
    } finally {
      setChecking(false);
    }
  };

  const handleSave = () =>
    updateNickname.mutate(trimmed, {
      onSuccess: () => {
        setCheck(null);
        Alert.alert('닉네임을 바꿨어요');
      },
      onError: (error) => Alert.alert('닉네임을 바꾸지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.')),
    });

  const handleTogglePrivacy = (key: keyof Privacy, value: boolean) =>
    updatePrivacy.mutate(
      { [key]: value },
      { onError: (error) => Alert.alert('공개 설정을 바꾸지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.')) },
    );

  const confirmWithdraw = () =>
    Alert.alert(
      '정말 탈퇴할까요?',
      '탈퇴하면 찜한 공연, 관심 아티스트, 체크리스트, 알림이 모두 삭제되고 되돌릴 수 없어요. 작성한 글과 후기는 "탈퇴한 회원"이라는 이름으로 남아요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '탈퇴하기',
          style: 'destructive',
          onPress: async () => {
            setWithdrawing(true);
            try {
              await withdrawAccount();
              await signOut();
            } catch (error) {
              setWithdrawing(false);
              Alert.alert('탈퇴하지 못했어요', errorMessage(error, '잠시 후 다시 시도해주세요.'));
            }
          },
        },
      ],
    );

  return (
    <Screen topInset={false} keyboard>
      <View style={styles.avatar}>
        <Pressable onPress={openPhotoMenu} disabled={uploadingPhoto || updateImage.isPending} accessibilityRole="button" accessibilityLabel="프로필 사진 바꾸기">
          <Avatar uri={user.profileImage} name={user.nickname} size={88} />
          <View style={styles.camera}>
            {uploadingPhoto || updateImage.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <SymbolView name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }} tintColor={colors.white} size={15} />
            )}
          </View>
        </Pressable>
        <AppText size={13} color={colors.textMuted}>
          사진을 눌러 바꿀 수 있어요
        </AppText>
      </View>

      <View style={styles.card}>
        <TextField label="이메일" value={user.email} editable={false} clearable={false} />
        <View>
          <TextField
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            maxLength={10}
            autoCapitalize="none"
            autoCorrect={false}
            error={nicknameInvalid ? '닉네임은 2~10자로 입력해주세요.' : check?.nickname === trimmed && !check.ok ? check.message || '이미 사용 중인 닉네임이에요.' : null}
            success={checkedOk ? check.message || '사용 가능한 닉네임이에요.' : null}
            hint={changed && !nicknameInvalid && !check ? '바꾸려면 중복 확인을 먼저 해주세요.' : null}
          />
        </View>
        {changed ? (
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button title="중복 확인" variant="secondary" onPress={handleCheck} loading={checking} disabled={nicknameInvalid} />
            </View>
            <View style={styles.flex}>
              <Button title="저장" onPress={handleSave} loading={updateNickname.isPending} disabled={!checkedOk} />
            </View>
          </View>
        ) : null}
      </View>

      <MenuCard>
        <MenuRow
          label="비밀번호 변경"
          icon={{ ios: 'key', android: 'vpn_key', web: 'vpn_key' }}
          onPress={() => router.push('/my/password')}
        />
      </MenuCard>

      {/* 프로필 공개 설정 */}
      <View style={styles.card}>
        <AppText weight="bold" size={18}>
          프로필 공개 설정
        </AppText>
        <AppText size={14} color={colors.textSecondary} style={styles.desc}>
          로그인한 다른 회원이 내 프로필에서 볼 수 있는 항목이에요. 끄면 나만 볼 수 있어요.
        </AppText>
        {privacy ? (
          PRIVACY_ITEMS.map((item) => (
            <View key={item.key} style={styles.switchRow}>
              <View style={styles.flex}>
                <AppText weight="medium" size={16}>
                  {item.label}
                </AppText>
                <AppText size={13} color={colors.textMuted}>
                  {privacy[item.key] ? '공개' : '비공개'}
                </AppText>
              </View>
              <Switch
                value={privacy[item.key]}
                onValueChange={(value) => handleTogglePrivacy(item.key, value)}
                trackColor={{ true: colors.brand }}
                thumbColor={colors.white}
                disabled={updatePrivacy.isPending}
              />
            </View>
          ))
        ) : (
          <ActivityIndicator color={colors.brand} />
        )}
      </View>

      <Pressable onPress={confirmWithdraw} disabled={withdrawing} style={styles.withdraw} accessibilityRole="button">
        <AppText size={14} color={colors.textMuted} style={styles.underline}>
          {withdrawing ? '탈퇴 처리 중...' : '회원 탈퇴'}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  avatar: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  camera: { position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  card: { gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.white },
  row: { flexDirection: 'row', gap: spacing.sm },
  desc: { lineHeight: 21 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  withdraw: { alignItems: 'center', paddingVertical: spacing.lg },
  underline: { textDecorationLine: 'underline' },
});
