import type { NotifiedStatus, WatchedStatus } from './statusChange.ts'

export interface NoticeRow {
  transport_id: string
  last_notified_kind: string | null
  last_notified_estimated_at: string | null
  last_notified_gate: string | null
}

export function toNotifiedStatus(notice: NoticeRow | undefined): NotifiedStatus {
  return {
    lastNotifiedKind: notice?.last_notified_kind ?? null,
    lastNotifiedEstimatedAt: notice?.last_notified_estimated_at ?? null,
    lastNotifiedGate: notice?.last_notified_gate || null,
  }
}

export function nextNoticeState(status: WatchedStatus): NotifiedStatus {
  return {
    lastNotifiedKind: status.kind,
    lastNotifiedEstimatedAt: status.estimatedAt,
    lastNotifiedGate: status.gate,
  }
}
