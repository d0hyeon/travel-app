export type ReportTargetType = 'post' | 'user'

export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'other'

export interface ReportInput {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  detail?: string
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: '스팸·광고',
  inappropriate: '부적절한 콘텐츠',
  harassment: '괴롭힘·혐오 표현',
  other: '기타',
}
