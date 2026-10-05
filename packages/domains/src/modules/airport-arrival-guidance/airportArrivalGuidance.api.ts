import { supabase } from '../../gateways/client'
import type {
  AirportArrivalGuidance,
  AirportArrivalGuidanceQuery,
} from './airportArrivalGuidance.types'

interface GetGuidanceResponse {
  action: 'get-guidance'
  guidance: AirportArrivalGuidance | null
}

export async function getAirportArrivalGuidanceForTransport(
  input: AirportArrivalGuidanceQuery,
): Promise<AirportArrivalGuidance | null> {
  const { data, error } = await supabase.functions.invoke<GetGuidanceResponse>('airport-arrival-guidance', {
    body: { action: 'get-guidance', ...input },
  })

  if (error != null) throw error
  if (data == null || data.action !== 'get-guidance') {
    throw new Error('공항 도착 안내 조회에 실패했습니다.')
  }

  return data.guidance
}
