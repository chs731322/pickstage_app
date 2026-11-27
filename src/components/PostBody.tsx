import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { parseContent } from '@/lib/postContent';
import { colors, radius, spacing } from '@/theme';

// 글 본문: 글 덩어리와 사진 덩어리를 순서대로 그린다 (사진을 누르면 크게 열린다)
export function PostBody({ content }: { content: string }) {
  const blocks = parseContent(content);
  return (
    <View style={styles.body}>
      {blocks.map((block, index) =>
        block.type === 'text' ? (
          block.text.trim() ? (
            <AppText key={index} size={16} style={styles.text} selectable>
              {block.text}
            </AppText>
          ) : null
        ) : (
          <PostImage key={index} src={block.src} alt={block.alt} />
        ),
      )}
    </View>
  );
}

// 사진은 원래 비율대로 그린다 (불러오면 비율을 알게 된다)
function PostImage({ src, alt }: { src: string; alt: string }) {
  const [ratio, setRatio] = useState(4 / 3);
  return (
    <Pressable onPress={() => WebBrowser.openBrowserAsync(src)} accessibilityRole="imagebutton" accessibilityLabel={alt}>
      <Image
        source={{ uri: src }}
        style={[styles.image, { aspectRatio: ratio }]}
        contentFit="cover"
        transition={150}
        onLoad={(event) => {
          const { width, height } = event.source;
          if (width && height) setRatio(width / height);
        }}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  text: { lineHeight: 24 },
  image: { width: '100%', borderRadius: radius.md, backgroundColor: colors.surface },
});
