import { supabase } from '../../gateways/client'
import type {
  AirportArrivalGuidance,
  AirportArrivalGuidanceItem,
  AirportArrivalGuidanceQuery,
  AirportArrivalGuidancesQuery,
  DepartureGateRecommendation,
} from './airportArrivalGuidance.types'

const FUNCTION_NAME = 'airport-arrival-guidance'

interface GetGuidancesResponse {
  action: 'get-guidances'
  guidances: AirportArrivalGuidanceItem[]
}

interface GetDepartureGateRecommendationResponse {
  action: 'get-departure-gate-recommendation'
  recommendation: DepartureGateRecommendation | null
}

export async function getAirportArrivalGuidances(
  input: AirportArrivalGuidancesQuery,
): Promise<AirportArrivalGuidanceItem[]> {
  if (input.transportIds.length === 0) return []

  const { data, error } = await supabase.functions.invoke<GetGuidancesResponse>(FUNCTION_NAME, {
    body: { action: 'get-guidances', ...input },
  })

  if (error != null) throw error
  if (data == null || data.action !== 'get-guidances') {
    throw new Error('공항 도착 안내 조회에 실패했습니다.')
  }

  return data.guidances
}

export async function getAirportArrivalGuidanceForTransport(
  input: AirportArrivalGuidanceQuery,
): Promise<AirportArrivalGuidance | null> {
  const guidances = await getAirportArrivalGuidances({
    tripId: input.tripId,
    transportIds: [input.transportId],
  })

  return guidances[0]?.guidance ?? null
}

export async function getDepartureGateRecommendation(
  terminal: string,
): Promise<DepartureGateRecommendation | null> {
  const { data, error } = await supabase.functions.invoke<GetDepartureGateRecommendationResponse>(FUNCTION_NAME, {
    body: { action: 'get-departure-gate-recommendation', terminal },
  })

  if (error != null) throw error
  if (data == null || data.action !== 'get-departure-gate-recommendation') {
    throw new Error('출국장 추천 조회에 실패했습니다.')
  }

  return data.recommendation
}
