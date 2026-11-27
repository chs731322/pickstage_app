import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { PosterCard } from '@/components/PosterCard';
import { SpotifyEmbed } from '@/components/SpotifyEmbed';
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
import { brandScale, colors, radius, spacing } from '@/theme';

// 어두운 사진 배경 위에 투명하게 떠 있는 제목줄: 흰색 뒤로 가기 버튼, 제목 없음 (안드로이드도 투명하게 해서 사진이 맨 위까지 이어지게 한다)
const artistHeaderOptions = {
  title: '',
  headerTransparent: true,
  headerTintColor: colors.white,
  headerShadowVisible: false,
  ...(Platform.OS === 'ios' ? { headerBlurEffect: 'none' as const } : { headerStyle: { backgroundColor: 'transparent' } }),
};

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

  return <ArtistBody artist={artist} />;
}

function ArtistBody({ artist }: { artist: ArtistDetail }) {
  const { width } = useWindowDimensions();
  // 제목줄이 투명하게 사진 위에 떠 있으므로 그 높이만큼 아래에서 시작한다
  const headerHeight = useHeaderHeight();
  const { isLoggedIn } = useAuth();
  const { data: interests } = useInterestedArtists();
  const toggleFavorite = useToggleFavoriteArtist(artist.id);

  const isFavorite = Boolean(interests?.some((item) => item.id === artist.id));
  const mainGenre = genreLabel(artist.genre);
  const typeLabel = artist.artistType ? (ARTIST_TYPE_LABEL[artist.artistType] ?? artist.artistType) : '';
  const tags = [mainGenre, typeLabel, ...tagLabels(artist.genreTags, artist.genre)].filter(Boolean).slice(0, 5) as string[];
  const upcoming = artist.upcomingConcerts ?? [];
  const past = artist.pastConcerts ?? [];
  const interestCount = artist.interestCount ?? 0;
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
      <Stack.Screen options={artistHeaderOptions} />
      {/* 맨 위가 어두운 사진 배경이라 상태바 글자는 흰색 */}
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* 맨 위: 프로필 사진을 크게 흐리게 깐 배경 위에 사진 카드, 이름, 태그, 공연 수, 버튼 */}
        <View style={[styles.hero, { paddingTop: headerHeight + spacing.md }]}>
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

          {/* 반투명 카드 두 장: 예정 공연, 지난 공연 */}
          <View style={styles.stats}>
            <StatCard label="예정 공연" value={upcoming.length} />
            <StatCard label="지난 공연" value={past.length} />
            {/* 관심 수는 0이면 숨긴다 (비어 보이지 않게) */}
            {interestCount > 0 ? <StatCard label="관심" value={interestCount} /> : null}
          </View>

          {/* 흰 알약 버튼과 바로가기(스포티파이·인스타그램·공식 사이트) 동그라미 */}
          <View style={styles.actions}>
            {/* 하트 하나: 관심 아티스트 추가/해제 (눌러서 채워진 하트가 되면 관심 등록된 것) */}
            <Pressable
              onPress={handleFavorite}
              style={styles.heart}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? '관심 아티스트 해제' : '관심 아티스트로 추가'}
              accessibilityState={{ selected: isFavorite }}>
              <Image
                source={isFavorite ? require('../../../assets/images/brand/heart-filled.svg') : require('../../../assets/images/brand/heart-outline.svg')}
                style={styles.heartIcon}
                contentFit="contain"
              />
            </Pressable>
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
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText weight="bold" size={22} color={colors.white}>
        {value}
      </AppText>
      <AppText weight="medium" size={13} color="rgba(255,255,255,0.85)">
        {label}
      </AppText>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.background },
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
  stats: { flexDirection: 'row', gap: spacing.ms, alignSelf: 'stretch', marginTop: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.ms, alignSelf: 'stretch', marginTop: spacing.sm },
  heart: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  heartIcon: { width: 28, height: 28 },
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
    shadowColor: colors.shadowInk,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  description: { lineHeight: 24 },
  concerts: { gap: spacing.md, marginTop: spacing.md },
  concertsTitle: { paddingHorizontal: spacing.md },
  concertsList: { gap: spacing.md, paddingHorizontal: spacing.md },
});
