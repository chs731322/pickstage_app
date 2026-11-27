import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PosterCard } from '@/components/PosterCard';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';
import { HeaderIcon, STICKY_HEADER_HEIGHT, StickyHeader } from '@/components/StickyHeader';
import {
  useArtist,
  useInterestedArtists,
  useToggleFavoriteArtist,
  type ArtistConcert,
  type ArtistDetail,
} from '@/features/artists';
import { useAuth } from '@/lib/auth';
import { genreLabel, tagLabels } from '@/lib/genreLabel';
import { spotifyArtistId } from '@/lib/spotify';
import { brandScale, cardShadow, colors, radius, spacing } from '@/theme';

// 이만큼 내리면 헤더에 바탕이 깔려서 아이콘·상태바 글자를 어둡게 바꾼다
const SOLID_HEADER_OFFSET = 32;

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
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + STICKY_HEADER_HEIGHT;
  // 불러오는 중·실패 화면은 스크롤이 없어서 헤더가 늘 투명하다
  const [idleScroll] = useState(() => new Animated.Value(0));

  if (isPending) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <StickyHeader title="" scrollY={idleScroll} />
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (error || !artist) {
    return (
      <View style={[styles.center, { paddingTop: topPadding }]}>
        <StickyHeader title="" scrollY={idleScroll} />
        <AppText weight="bold" size={18}>
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
  const [scrollY] = useState(() => new Animated.Value(0));
  const [solid, setSolid] = useState(false);
  const { isLoggedIn } = useAuth();
  const { data: interests } = useInterestedArtists();
  const toggleFavorite = useToggleFavoriteArtist(artist.id);

  const isFavorite = Boolean(interests?.some((item) => item.id === artist.id));
  const mainGenre = genreLabel(artist.genre);
  const typeLabel = artist.artistType ? (ARTIST_TYPE_LABEL[artist.artistType] ?? artist.artistType) : '';
  const tags = [mainGenre, typeLabel, ...tagLabels(artist.genreTags, artist.genre)].filter(Boolean).slice(0, 5) as string[];
  const upcoming = artist.upcomingConcerts ?? [];
  const past = artist.pastConcerts ?? [];
  const photo = Math.min(width * 0.52, 220);
  const spotifyId = spotifyArtistId(artist.spotifyUrl);
  const links = [
    { label: 'Spotify', logo: require('../../../assets/images/brand/spotify.svg'), url: artist.spotifyUrl },
    { label: 'Instagram', logo: require('../../../assets/images/brand/instagram.svg'), url: artist.instagramUrl },
    { label: '공식 사이트', logo: require('../../../assets/images/brand/website.svg'), url: artist.officialUrl },
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
      {/* 맨 위가 어두운 사진 배경이라 상태바 글자는 흰색, 내려서 헤더에 바탕이 깔리면 어둡게 */}
      <StatusBar style={solid ? 'dark' : 'light'} />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: Platform.OS !== 'web',
          listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => setSolid(event.nativeEvent.contentOffset.y > SOLID_HEADER_OFFSET),
        })}>
        {/* 맨 위: 프로필 사진을 크게 흐리게 깐 배경 위에 사진 카드, 이름, 태그, 바로가기 */}
        <View style={[styles.hero, { paddingTop: topPadding + spacing.md }]}>
          {artist.profileImage ? (
            <>
              <Image source={{ uri: artist.profileImage }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={60} />
              <View style={[StyleSheet.absoluteFill, styles.heroShade]} />
            </>
          ) : (
            // 사진이 없는 아티스트는 핑크 그라데이션 배경
            <LinearGradient
              colors={[brandScale[300], brandScale[500], brandScale[700]]}
              style={StyleSheet.absoluteFill}
            />
          )}

          {artist.profileImage ? (
            <Image
              source={{ uri: artist.profileImage }}
              style={[styles.photo, { width: photo, height: photo }]}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.photo, styles.noImage, { width: photo, height: photo }]}>
              <AppText weight="bold" color={colors.brand} style={{ fontSize: 64 }}>
                {artist.name.slice(0, 1)}
              </AppText>
            </View>
          )}

          <AppText weight="bold" size={22} color={colors.white} style={styles.name}>
            {artist.name}
          </AppText>
          {artist.englishName ? (
            <AppText size={14} color="rgba(255,255,255,0.8)">
              {artist.englishName}
            </AppText>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <AppText weight="semibold" size={13} color={colors.white}>
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {/* 바로가기(스포티파이·인스타그램·공식 사이트) 동그라미 */}
          {links.length > 0 ? (
            <View style={styles.actions}>
              {links.map((link) => (
                <Pressable
                  key={link.label}
                  onPress={() => WebBrowser.openBrowserAsync(link.url!)}
                  style={styles.linkCircle}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}>
                  <Image source={link.logo} style={styles.linkLogo} contentFit="contain" />
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        {artist.description ? (
          <View style={styles.card}>
            <AppText weight="bold" size={18}>
              소개
            </AppText>
            <AppText size={16} color={colors.textSecondary} style={styles.description}>
              {artist.description}
            </AppText>
          </View>
        ) : null}

        {/* 스포티파이 공식 플레이어: 인기곡 목록과 미리듣기 (스포티파이 링크가 있는 아티스트만) */}
        {spotifyId ? (
          <View style={styles.card}>
            <AppText weight="bold" size={18}>
              인기곡 듣기
            </AppText>
            <SpotifyEmbed artistId={spotifyId} openUrl={artist.spotifyUrl!} />
          </View>
        ) : null}

        <ConcertRow title="예정된 공연" concerts={upcoming} />
        <ConcertRow title="출연했던 공연" concerts={past} />
      </Animated.ScrollView>

      {/* 위에 고정되는 헤더: 뒤로 가기와 찜 */}
      <StickyHeader
        title={artist.name}
        scrollY={scrollY}
        tint={solid ? colors.text : colors.white}
        right={
          <HeaderIcon
            label={isFavorite ? '관심 아티스트 해제' : '관심 아티스트로 추가'}
            icon={isFavorite ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            active={isFavorite}
            onPress={handleFavorite}
            color={solid ? colors.text : colors.white}
            activeColor={solid ? colors.brand : colors.white}
          />
        }
      />
    </View>
  );
}

function ConcertRow({ title, concerts }: { title: string; concerts: ArtistConcert[] }) {
  if (concerts.length === 0) return null;
  return (
    <View style={styles.concerts}>
      <AppText weight="bold" size={18} style={styles.concertsTitle}>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.pageBg },
  centerText: { textAlign: 'center' },
  retry: { marginTop: spacing.md, alignSelf: 'stretch' },
  // 맨 위 영역: 아래 모서리를 둥글게 잘라서 뒤의 흐린 사진이 깔끔하게 끝나게 한다
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroShade: { backgroundColor: 'rgba(20,0,30,0.4)' },
  photo: {
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: colors.surface,
    marginBottom: spacing.xs,
  },
  noImage: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  name: { textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  tag: {
    paddingHorizontal: spacing.ms,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.ms, alignSelf: 'stretch', marginTop: spacing.sm },
  linkLogo: { width: 24, height: 24 },
  linkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  card: {
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    ...cardShadow,
  },
  description: { lineHeight: 24 },
  concerts: { gap: spacing.md, marginTop: spacing.md },
  concertsTitle: { paddingHorizontal: spacing.md },
  concertsList: { gap: spacing.md, paddingHorizontal: spacing.md },
});
