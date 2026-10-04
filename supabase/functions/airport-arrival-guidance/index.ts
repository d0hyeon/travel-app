import { createClient } from 'npm:@supabase/supabase-js@2'
import { getGuidanceForTransport } from './guidanceForTransport.ts'
import type {
  AirportArrivalGuidanceFunctionRequest,
  AirportArrivalGuidanceFunctionResponse,
} from './types.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

async function handleAirportArrivalGuidance(
  request: AirportArrivalGuidanceFunctionRequest,
): Promise<AirportArrivalGuidanceFunctionResponse> {
  const guidance = await getGuidanceForTransport(supabase, {
    tripId: request.tripId,
    transportId: request.transportId,
    now: new Date(),
  })

  return { action: 'get-guidance', guidance }
}

async function canReadTripGuidance(userId: string, tripId: string): Promise<boolean> {
  const { data } = await supabase
    .from('active_trip_members')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle()
  return data != null
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authorization = req.headers.get('authorization')
  if (authorization == null || !authorization.startsWith('Bearer ')) return null

  const { data, error } = await supabase.auth.getUser(authorization.slice('Bearer '.length))
  if (error != null || data.user == null) return null
  return data.user.id
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request = (await req.json()) as AirportArrivalGuidanceFunctionRequest
    const userId = await getAuthenticatedUserId(req)
    const isTripMember = userId != null && (await canReadTripGuidance(userId, request.tripId))
    if (!isTripMember) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403, headers: corsHeaders })
    }

    const result = await handleAirportArrivalGuidance(request)
    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: corsHeaders })
  }
})
