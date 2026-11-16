// 게시글 본문은 글과 사진이 섞인 텍스트다. 사진은 한 줄에 `![사진](주소)` 형태로 적는다. (웹 utils/postContent.js 와 같은 규칙)
// 사진 주소는 우리 이미지 저장소 것만 허용한다. (서버도 같은 규칙으로 검사)
export const IMAGE_PREFIX = 'https://pickstage-images.s3.ap-northeast-2.amazonaws.com/';
export const POST_TEXT_MAX_LENGTH = 5000;
export const POST_IMAGES_MAX_COUNT = 30;
export const TITLE_MAX_LENGTH = 100;

const IMAGE_LINE = /^!\[([^\]]*)\]\((\S+)\)$/;

export const imageToken = (url: string) => `![사진](${url})`;

export type ContentBlock = { type: 'text'; text: string } | { type: 'image'; alt: string; src: string };

// 본문을 글 덩어리와 사진 덩어리로 나눈다
export function parseContent(content = ''): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let textLines: string[] = [];
  const flushText = () => {
    if (textLines.length > 0) {
      blocks.push({ type: 'text', text: textLines.join('\n') });
      textLines = [];
    }
  };
  for (const line of content.split('\n')) {
    const match = line.trim().match(IMAGE_LINE);
    if (match && match[2].startsWith(IMAGE_PREFIX)) {
      flushText();
      blocks.push({ type: 'image', alt: match[1] || '사진', src: match[2] });
    } else {
      textLines.push(line);
    }
  }
  flushText();
  return blocks;
}

// 본문에 들어 있는 사진 주소 (순서대로, 중복 없이)
export function extractImageUrls(content = ''): string[] {
  const urls = parseContent(content).flatMap((b) => (b.type === 'image' ? [b.src] : []));
  return [...new Set(urls)];
}

// 사진을 뺀 글자 수 (글자 수 제한은 글에만 적용)
export function textLength(content = ''): number {
  return parseContent(content).reduce((sum, b) => sum + (b.type === 'text' ? b.text.length : 0), 0);
}

// '방금 전', '3분 전', '2시간 전', '5일 전', 그 이상은 날짜
export function timeAgo(value: string | null): string {
  if (!value) return '';
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return value.slice(0, 10).replaceAll('-', '.');
}
