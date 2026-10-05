export interface ScheduledNotificationJobRow {
  id: string
  status: 'pending' | 'processing' | 'delivered' | 'failed' | 'cancelled'
  attemptCount: number
}

const RETRY_DELAYS_MINUTES = [5, 15, 30]
const MAX_ATTEMPT_COUNT = 3

/** pending 상태인 작업만 processing 으로 점유한다. 이미 다른 상태면 점유하지 않는다. */
export function claimScheduledNotificationJob(job: Pick<ScheduledNotificationJobRow, 'status'>) {
  return job.status === 'pending'
}

export interface ScheduledNotificationJobFailureOutcome {
  status: 'pending' | 'failed'
  attemptCount: number
  scheduledFor?: string
}

/**
 * 조회·발송 오류 뒤의 다음 상태를 계산한다.
 *
 * 세 번째 오류까지는 5·15·30분 뒤로 재시도하며 processing → pending 으로
 * 되돌린다. 그 뒤로는 failed 로 끝내고 더 이상 재시도 시각을 주지 않는다.
 */
export function markScheduledNotificationJobFailed(
  job: Pick<ScheduledNotificationJobRow, 'attemptCount'>,
  now: Date,
): ScheduledNotificationJobFailureOutcome {
  const attemptCount = job.attemptCount + 1

  if (attemptCount > MAX_ATTEMPT_COUNT) {
    return { status: 'failed', attemptCount: job.attemptCount }
  }

  const delayMinutes = RETRY_DELAYS_MINUTES[attemptCount - 1]
  const scheduledFor = new Date(now.getTime() + delayMinutes * 60 * 1000)

  return { status: 'pending', attemptCount, scheduledFor: scheduledFor.toISOString() }
}
