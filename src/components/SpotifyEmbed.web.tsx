import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';
import { SPOTIFY_EMBED_HEIGHT, spotifyEmbedUrl } from '@/lib/spotify';

// 웹 미리보기용: react-native-webview 는 웹에서 동작하지 않아서 iframe 으로 같은 임베드를 보여준다.
// openUrl 은 앱(WebView)에서 안 뜰 때 쓰는 버튼용이라 웹에서는 쓰지 않는다
export function SpotifyEmbed({ artistId }: { artistId: string; openUrl?: string }) {
  return (
    <View style={styles.box}>
      {createElement('iframe', {
        src: spotifyEmbedUrl(artistId),
        title: '스포티파이 인기곡 미리듣기',
        width: '100%',
        height: SPOTIFY_EMBED_HEIGHT,
        style: { border: 0 },
        allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
        loading: 'lazy',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { height: SPOTIFY_EMBED_HEIGHT, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface },
});
