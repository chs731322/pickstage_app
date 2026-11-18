// 스포티파이 아티스트 주소(open.spotify.com/artist/<id>)에서 아티스트 id만 꺼낸다. 아니면 null.
export function spotifyArtistId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?artist\/([A-Za-z0-9]{10,40})/);
  return match ? match[1] : null;
}

// 스포티파이 공식 임베드 주소 (API 키 필요 없음). 아티스트 임베드는 인기곡 목록과 미리듣기를 보여준다.
export function spotifyEmbedUrl(artistId: string): string {
  return `https://open.spotify.com/embed/artist/${artistId}?utm_source=generator`;
}

// 아티스트 임베드 높이 (이보다 작으면 인기곡 목록이 잘린다)
export const SPOTIFY_EMBED_HEIGHT = 352;
