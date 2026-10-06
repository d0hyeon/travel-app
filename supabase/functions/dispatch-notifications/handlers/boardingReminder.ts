import { getAirportCityName } from '../../airport-arrival-guidance/airports.ts'
import type { NotificationHandler } from '../dispatch.ts'
import { sendPushToRecipients } from '../sendPush.ts'
import { toBoardingReminderMessage } from './boardingReminderMessage.ts'

interface FlightStatusRow {
  kind: string | null
  estimated_at: string | null
  scheduled_at: string | null
}

interface TransportRow {
  id: string
  trip_id: string
  type: string
  airline: string | null
  flight_number: string | null
  departure_name: string
  arrival_name: string
  departure_at: string
  arrival_airport_code: string | null
}

export const handleBoardingReminder: NotificationHandler = async (notification, { supabase, now }) => {
  const { data: transport } = await supabase
    .from('trip_transports')
    .select('id, trip_id, type, airline, flight_number, departure_name, arrival_name, departure_at, arrival_airport_code')
    .eq('id', notification.subject_id)
    .maybeSingle()

  if (transport == null) return 'cancelled'
  const typedTransport = transport as TransportRow

  const { data: flightStatus } = await supabase
    .from('trip_transport_flight_status')
    .select('kind, estimated_at, scheduled_at')
    .eq('transport_id', typedTransport.id)
    .maybeSingle()
  const typedFlightStatus = flightStatus as FlightStatusRow | null

  if (typedFlightStatus?.kind === 'cancelled') return 'cancelled'

  const departureAt =
    typedFlightStatus?.estimated_at ?? typedFlightStatus?.scheduled_at ?? typedTransport.departure_at
  if (new Date(departureAt) <= now) return 'skipped'

  const arrivalCityName =
    typedTransport.type === 'flight'
      ? ((await getAirportCityName(supabase, typedTransport.arrival_airport_code ?? '')) ?? typedTransport.arrival_name)
      : typedTransport.arrival_name

  const message = toBoardingReminderMessage({
    type: typedTransport.type,
    airline: typedTransport.airline,
    flightNumber: typedTransport.flight_number,
    arrivalCityName,
    departureName: typedTransport.departure_name,
    arrivalName: typedTransport.arrival_name,
  })
  const result = await sendPushToRecipients(supabase, typedTransport.trip_id, message, {
    tripId: typedTransport.trip_id,
    transportId: typedTransport.id,
  })

  if (result.attempted > 0 && result.sent === 0) {
    throw new Error(`푸시 발송 전체 실패: ${result.errors.join('; ')}`)
  }

  return result.sent > 0 ? 'sent' : 'skipped'
}
