import {
  getDepartureGateRecommendation,
  getGuidanceForTransport,
} from '../../airport-arrival-guidance/guidanceForTransport.ts'
import {
  getIsDepartureGateRecommendable,
  REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES,
} from '../../airport-arrival-guidance/guidance.ts'
import { toIncheonTerminalCode } from '../../airport-arrival-guidance/incheonTerminal.ts'
import type { NotificationHandler } from '../dispatch.ts'
import { sendPushToRecipients } from '../sendPush.ts'
import { toDepartureGateRecommendationMessage } from './departureGateRecommendationMessage.ts'

const GUIDANCE_RETRY_MINUTES = 10
const MS_PER_MINUTE = 60 * 1000

interface TransportRow {
  id: string
  trip_id: string
  departure_at: string
}

interface FlightStatusRow {
  kind: string | null
  estimated_at: string | null
}

export const handleDepartureGateRecommendation: NotificationHandler = async (notification, { supabase, now }) => {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, trip_id, departure_at')
    .eq('id', notification.subject_id)
    .maybeSingle()

  if (transport == null) return 'cancelled'
  const typedTransport = transport as TransportRow

  const { data: flightStatus } = await supabase
    .from('trip_transport_flight_status')
    .select('kind, estimated_at')
    .eq('transport_id', typedTransport.id)
    .maybeSingle()
  const typedFlightStatus = flightStatus as FlightStatusRow | null

  if (typedFlightStatus?.kind === 'cancelled') return 'cancelled'

  const departureAt = typedFlightStatus?.estimated_at ?? typedTransport.departure_at
  if (new Date(departureAt) <= now) return 'skipped'

  const guidance = await getGuidanceForTransport(supabase, {
    tripId: typedTransport.trip_id,
    transportId: typedTransport.id,
    now,
  })
  if (guidance == null) {
    return { rescheduledFor: new Date(now.getTime() + GUIDANCE_RETRY_MINUTES * MS_PER_MINUTE) }
  }

  if (guidance.terminal == null) return 'skipped'
  const terminalCode = toIncheonTerminalCode(guidance.terminal)
  if (terminalCode == null) return 'skipped'

  if (!getIsDepartureGateRecommendable(guidance, now)) {
    const windowStartAt = new Date(
      new Date(guidance.recommendedArrivalAt).getTime() - REALTIME_GATE_RECOMMENDATION_WINDOW_MINUTES * MS_PER_MINUTE,
    )
    return { rescheduledFor: windowStartAt }
  }

  const recommendation = await getDepartureGateRecommendation(supabase, { terminal: guidance.terminal })
  if (recommendation == null) return 'skipped'

  const message = toDepartureGateRecommendationMessage(recommendation, { terminal: terminalCode })
  const result = await sendPushToRecipients(supabase, typedTransport.trip_id, message, {
    tripId: typedTransport.trip_id,
    transportId: typedTransport.id,
  })

  if (result.attempted > 0 && result.sent === 0) {
    throw new Error(`푸시 발송 전체 실패: ${result.errors.join('; ')}`)
  }

  return result.sent > 0 ? 'sent' : 'skipped'
}
