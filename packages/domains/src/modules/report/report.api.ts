import { assert } from '@waylog/utility'
import { getSession } from '../../gateways/auth'
import { supabase } from '../../gateways/client'
import type { ReportInput } from './report.types'

const UNIQUE_VIOLATION = '23505'

export async function submitReport({ targetType, targetId, reason, detail }: ReportInput) {
  const reporter = getSession()
  assert(reporter != null, '인증 정보가 만료되었습니다.')

  const { error } = await supabase.from('reports').insert({
    reporter_id: reporter.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    detail: detail ?? null,
  })

  const isAlreadyReported = error?.code === UNIQUE_VIOLATION
  if (error != null && !isAlreadyReported) throw error
}
