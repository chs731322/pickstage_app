import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { AppText } from '@/components/AppText';
import { SPOTIFY_EMBED_HEIGHT, spotifyEmbedUrl } from '@/lib/spotify';
import { colors, radius, spacing } from '@/theme';

const SLOW_MS = 12000;

// 스포티파이 공식 임베드 플레이어 (인기곡 목록과 미리듣기). 로고와 스포티파이로 가는 링크가 플레이어 안에 기본으로 들어 있다.
// 오래 안 뜨거나 실패하면 "스포티파이에서 열기" 버튼을 보여준다.
export function SpotifyEmbed({ artistId, openUrl }: { artistId: string; openUrl: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'slow' | 'failed'>('loading');
  const uri = spotifyEmbedUrl(artistId);

  useEffect(() => {
    const timer = setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), SLOW_MS);
    return () => clearTimeout(timer);
  }, []);

  const log = (...args: unknown[]) => {
    if (__DEV__) console.log('[SpotifyEmbed]', ...args);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <WebView
          source={{ uri }}
          style={styles.web}
          // 부모 스크롤 안에서 플레이어 자체는 스크롤하지 않는다
          scrollEnabled={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['https://*']}
          // 플레이어 안의 링크("스포티파이에서 열기", 로그인 등)를 눌렀을 때만 바깥 브라우저로 보낸다. 그 밖의 로딩은 막지 않는다.
          onShouldStartLoadWithRequest={(request) => {
            log('이동', request.navigationType, request.isTopFrame, request.url);
            const isEmbed = request.url.startsWith('https://open.spotify.com/embed/') || request.url === 'about:blank';
            if (isEmbed || request.isTopFrame === false) return true;
            const tappedLink = Platform.OS === 'ios' ? request.navigationType === 'click' : true;
            if (tappedLink && request.url.startsWith('https://')) {
              WebBrowser.openBrowserAsync(request.url);
              return false;
            }
            return true;
          }}
          onLoadEnd={() => {
            log('로드 끝');
            setState((s) => (s === 'failed' ? s : 'ready'));
          }}
          onError={(event) => {
            log('오류', event.nativeEvent.description);
            setState('failed');
          }}
          onHttpError={(event) => {
            log('HTTP 오류', event.nativeEvent.statusCode);
            setState('failed');
          }}
          accessibilityLabel="스포티파이 인기곡 미리듣기"
        />
        {state === 'loading' ? (
          <View style={[StyleSheet.absoluteFill, styles.loading]} pointerEvents="none">
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : null}
      </View>

      {state === 'slow' || state === 'failed' ? (
        <View style={styles.fallback}>
          <AppText size={14} color={colors.textMuted} style={styles.fallbackText}>
            {state === 'failed' ? '플레이어를 불러오지 못했어요.' : '플레이어가 늦게 떠요.'}
          </AppText>
          <Pressable
            onPress={() => WebBrowser.openBrowserAsync(openUrl)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="link">
            <AppText weight="bold" size={15} color={colors.white}>
              스포티파이에서 열기
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  box: { height: SPOTIFY_EMBED_HEIGHT, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surface },
  web: { flex: 1, backgroundColor: 'transparent' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  fallback: { alignItems: 'center', gap: spacing.sm },
  fallbackText: { textAlign: 'center' },
  button: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill, backgroundColor: colors.brand },
  pressed: { backgroundColor: colors.brandStrong },
});
