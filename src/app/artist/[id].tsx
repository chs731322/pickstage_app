import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PosterCard } from '@/components/PosterCard';
import {
  useArtist,
  useInterestedArtists,
  useToggleFavoriteArtist,
  type ArtistConcert,
  type ArtistDetail,
} from '@/features/artists';
import { useAuth } from '@/lib/auth';
import { heroHeaderOptions } from '@/lib/heroHeader';
import { genreLabel, tagLabels } from '@/lib/genreLabel';
import { colors, radius, spacing } from '@/theme';

const ARTIST_TYPE_LABEL: Record<string, string> = {
  solo: '솔로',
  band: '밴드',
  duo: '듀오',
  group: '그룹',
  dj: 'DJ',
  orchestra: '오케스트라',
};

export default function ArtistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: artist, isPending, error, refetch } = useArtist(id);
  const headerHeight = useHeaderHeight();
  const topPadding = Platform.OS === 'ios' ? headerHeight : 0;

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <AppText weight="bold" size={20}>
          아티스트를 찾을 수 없어요
        </AppText>
        <AppText color={colors.textMuted} size={16} style={styles.centerText}>
          삭제되었거나 잠시 불러오지 못했어요.
        </AppText>
        <View style={styles.retry}>
          <Button title="다시 시도" onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  return <ArtistBody artist={artist} topPadding={topPadding} />;
}

function ArtistBody({ artist, topPadding }: { artist: ArtistDetail; topPadding: number }) {
  const { width } = useWindowDimensions();
  const { isLoggedIn } = useAuth();
  const { data: interests } = useInterestedArtists();
  const toggleFavorite = useToggleFavoriteArtist(artist.id);

  const isFavorite = Boolean(interests?.some((item) => item.id === artist.id));
  const mainGenre = genreLabel(artist.genre);
  const typeLabel = artist.artistType ? (ARTIST_TYPE_LABEL[artist.artistType] ?? artist.artistType) : '';
  const tags = tagLabels(artist.genreTags, artist.genre);
  const upcoming = artist.upcomingConcerts ?? [];
  const past = artist.pastConcerts ?? [];
  const avatar = Math.min(width * 0.5, 220);
  const links = [
    { label: 'Spotify', icon: { ios: 'music.note', android: 'music_note', web: 'music_note' }, url: artist.spotifyUrl },
    { label: 'Instagram', icon: { ios: 'camera', android: 'photo_camera', web: 'photo_camera' }, url: artist.instagramUrl },
    { label: '공식 사이트', icon: { ios: 'safari', android: 'public', web: 'public' }, url: artist.officialUrl },
  ].filter((link) => link.url);

  const handleFavorite = () => {
    if (!isLoggedIn) {
      Alert.alert('로그인이 필요해요', '로그인하면 관심 아티스트로 등록할 수 있어요.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') },
      ]);
      return;
    }
    toggleFavorite.mutate(isFavorite, {
      onError: () => Alert.alert('처리하지 못했어요', '잠시 후 다시 시도해주세요.'),
    });
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen options={heroHeaderOptions} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 맨 위: 검정 바탕에 프로필 사진 */}
        <View style={[styles.hero, { paddingTop: topPadding + spacing.md }]}>
          {artist.profileImage ? (
            <Image
              source={{ uri: artist.profileImage }}
              style={{ width: avatar, height: avatar, borderRadius: avatar / 2, backgroundColor: colors.surface }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.noImage, { width: avatar, height: avatar, borderRadius: avatar / 2 }]}>
              <AppText weight="extrabold" size={64} color={colors.textMuted}>
                {artist.name.slice(0, 1)}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.titleBlock}>
          {mainGenre || typeLabel ? (
            <AppText weight="bold" size={15} color={colors.brand}>
              {[mainGenre, typeLabel].filter(Boolean).join(' · ')}
            </AppText>
          ) : null}
          <AppText weight="extrabold" size={28} style={styles.name}>
            {artist.name}
          </AppText>
          {artist.englishName ? (
            <AppText size={16} color={colors.textMuted}>
              {artist.englishName}
            </AppText>
          ) : null}
          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <AppText weight="semibold" size={13} color={colors.textSecondary}>
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            onPress={handleFavorite}
            style={[styles.favorite, isFavorite && styles.favoriteActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}>
            <SymbolView
              name={
                isFavorite
                  ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' }
                  : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }
              }
              tintColor={isFavorite ? colors.white : colors.brand}
              size={20}
            />
            <AppText weight="bold" size={16} color={isFavorite ? colors.white : colors.brand}>
              {isFavorite ? '관심 아티스트' : '관심 아티스트로 추가'}
            </AppText>
          </Pressable>

          {links.length > 0 ? (
            <View style={styles.links}>
              {links.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => WebBrowser.openBrowserAsync(link.url!)}
                  style={styles.link}
                  accessibilityRole="link">
                  <SymbolView name={link.icon as never} tintColor={colors.text} size={18} />
                  <AppText weight="semibold" size={14}>
                    {link.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {artist.description ? (
          <View style={styles.card}>
            <AppText weight="extrabold" size={21}>
              소개
            </AppText>
            <AppText size={16} color={colors.textSecondary} style={styles.description}>
              {artist.description}
            </AppText>
          </View>
        ) : null}

        <ConcertRow title="예정된 공연" concerts={upcoming} />
        <ConcertRow title="출연했던 공연" concerts={past} />
      </ScrollView>
    </View>
  );
}

function ConcertRow({ title, concerts }: { title: string; concerts: ArtistConcert[] }) {
  if (concerts.length === 0) return null;
  return (
    <View style={styles.concerts}>
      <AppText weight="extrabold" size={22} style={styles.concertsTitle}>
        {title} <AppText weight="bold" size={18} color={colors.brand}>{concerts.length}</AppText>
      </AppText>
      <FlatList
        data={concerts}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.concertsList}
        renderItem={({ item }) => <PosterCard festival={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.pageBg },
  content: { paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.background },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  hero: { backgroundColor: colors.pageBg, alignItems: 'center', paddingBottom: spacing.lg },
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  titleBlock: { gap: spacing.sm, padding: spacing.md, alignItems: 'center' },
  name: { textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: 4 },
  tag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  favorite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'stretch',
    height: 52,
    marginTop: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.white,
  },
  favoriteActive: { backgroundColor: colors.brand },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  card: {
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md + 2,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  description: { lineHeight: 26 },
  concerts: { gap: spacing.md, marginTop: spacing.md },
  concertsTitle: { paddingHorizontal: spacing.md },
  concertsList: { gap: spacing.md, paddingHorizontal: spacing.md },
});
