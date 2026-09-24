import { useSuspenseQuery } from '@waylog/react'
import { supabase } from '../../gateways/client'

export interface FlightGateChange {
  gate: string | null
  prevGate: string | null
}

type Row = { gate: string | null; prev_gate: string | null }

async function getFlightGateChange(transportId: string): Promise<FlightGateChange | null> {
  const { data, error } = await supabase
    .from('trip_transport_flight_status')
    .select('gate, prev_gate')
    .eq('transport_id', transportId)
    .maybeSingle<Row>()

  if (error) throw error
  if (data == null) return null

  return { gate: data.gate, prevGate: data.prev_gate }
}

export function useFlightGateChange(transportId: string | undefined): FlightGateChange | null {
  const { data } = useSuspenseQuery({
    queryKey: useFlightGateChange.key(transportId),
    enabled: transportId != null,
    queryFn: () => getFlightGateChange(transportId!),
  })

  return data ?? null
}

useFlightGateChange.key = (transportId: string | undefined) => ['flight-gate-change', transportId]
