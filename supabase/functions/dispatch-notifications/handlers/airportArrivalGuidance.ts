import { getAirportCityName } from '../../airport-arrival-guidance/airports.ts'
import { getGuidanceForTransport } from '../../airport-arrival-guidance/guidanceForTransport.ts'
import type { NotificationHandler } from '../dispatch.ts'
import { sendPushToRecipients } from '../sendPush.ts'
import { toAirportArrivalPushMessage } from './airportArrivalGuidanceMessage.ts'

interface TransportRow {
  id: string
  departure_airport_code: string | null
  arrival_airport_code: string | null
}

export const handleAirportArrivalGuidance: NotificationHandler = async (notification, { supabase, now }) => {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, departure_airport_code, arrival_airport_code')
    .eq('id', notification.subject_id)
    .maybeSingle()

  if (transport == null) return 'cancelled'
  const typedTransport = transport as TransportRow

  const guidance = await getGuidanceForTransport(supabase, {
    tripId: notification.trip_id,
    transportId: typedTransport.id,
    now,
  })
  if (guidance == null) return 'skipped'

  const [departureCityName, arrivalCityName] = await Promise.all([
    getAirportCityName(supabase, typedTransport.departure_airport_code ?? ''),
    getAirportCityName(supabase, typedTransport.arrival_airport_code ?? ''),
  ])

  const message = toAirportArrivalPushMessage(guidance, {
    departureCityName: departureCityName ?? '출발지',
    arrivalCityName: arrivalCityName ?? '도착지',
  })
  const result = await sendPushToRecipients(supabase, notification.trip_id, message, {
    tripId: notification.trip_id,
    transportId: typedTransport.id,
  })

  if (result.attempted > 0 && result.sent === 0) {
    throw new Error(`푸시 발송 전체 실패: ${result.errors.join('; ')}`)
  }

  return result.sent > 0 ? 'sent' : 'skipped'
}
