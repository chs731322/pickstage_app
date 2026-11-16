import { api } from '@/lib/api';

// 신고 대상: 게시글 / 댓글 / 공연장 후기 / 사용자
export type ReportTargetType = 'POST' | 'COMMENT' | 'VENUE_REVIEW' | 'USER';
export type ReportReason = 'SPAM' | 'ABUSE' | 'SEXUAL' | 'ILLEGAL' | 'PRIVACY' | 'OTHER';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: '스팸·광고' },
  { value: 'ABUSE', label: '욕설·혐오 표현' },
  { value: 'SEXUAL', label: '음란·선정적인 내용' },
  { value: 'ILLEGAL', label: '불법·사기 의심' },
  { value: 'PRIVACY', label: '개인정보 노출' },
  { value: 'OTHER', label: '기타' },
];

export const REPORT_TARGET_LABEL: Record<ReportTargetType, string> = {
  POST: '게시글',
  COMMENT: '댓글',
  VENUE_REVIEW: '공연장 후기',
  USER: '사용자',
};

export async function createReport(input: {
  targetType: ReportTargetType;
  targetId: number;
  reason: ReportReason;
  detail?: string;
}) {
  await api.post('/api/reports', input);
}

export async function blockUser(userId: number) {
  await api.post(`/api/blocks/${userId}`);
}
