import { createClient } from 'npm:@supabase/supabase-js@2'
import { getIsDepartureGateRecommendable } from './guidance.ts'
import {
  getDepartureGateRecommendation,
  getGuidanceForTransport,
  getGuidancesForTransports,
} from './guidanceForTransport.ts'
import type {
  AirportArrivalGuidanceFunctionRequest,
  AirportArrivalGuidanceFunctionResponse,
} from './types.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function parseRequest(body: unknown): AirportArrivalGuidanceFunctionRequest | null {
  if (typeof body !== 'object' || body === null || !('action' in body)) return null

  if (body.action === 'get-guidance') {
    if (!('tripId' in body) || !isString(body.tripId)) return null
    if (!('transportId' in body) || !isString(body.transportId)) return null
    return { action: 'get-guidance', tripId: body.tripId, transportId: body.transportId }
  }

  if (body.action === 'get-guidances') {
    if (!('tripId' in body) || !isString(body.tripId)) return null
    if (!('transportIds' in body) || !isStringArray(body.transportIds)) return null
    return { action: 'get-guidances', tripId: body.tripId, transportIds: body.transportIds }
  }

  if (body.action === 'get-departure-gate-recommendation') {
    if (!('terminal' in body) || !isString(body.terminal) || body.terminal === '') return null
    return { action: 'get-departure-gate-recommendation', terminal: body.terminal }
  }

  return null
}

async function handleGetGuidance(
  request: Extract<AirportArrivalGuidanceFunctionRequest, { action: 'get-guidance' }>,
): Promise<AirportArrivalGuidanceFunctionResponse> {
  const now = new Date()
  const guidance = await getGuidanceForTransport(supabase, {
    tripId: request.tripId,
    transportId: request.transportId,
    now,
  })
  if (guidance == null || !getIsDepartureGateRecommendable(guidance, now)) {
    return { action: 'get-guidance', guidance }
  }

  const recommendedDepartureGate = await getDepartureGateRecommendation(supabase, {
    terminal: guidance.terminal,
  })
  if (recommendedDepartureGate == null) return { action: 'get-guidance', guidance }

  return { action: 'get-guidance', guidance: { ...guidance, recommendedDepartureGate } }
}

async function handleGetGuidances(
  request: Extract<AirportArrivalGuidanceFunctionRequest, { action: 'get-guidances' }>,
): Promise<AirportArrivalGuidanceFunctionResponse> {
  const guidances = await getGuidancesForTransports(supabase, {
    tripId: request.tripId,
    transportIds: request.transportIds,
    now: new Date(),
  })

  return { action: 'get-guidances', guidances }
}

async function handleGetDepartureGateRecommendation(
  request: Extract<AirportArrivalGuidanceFunctionRequest, { action: 'get-departure-gate-recommendation' }>,
): Promise<AirportArrivalGuidanceFunctionResponse> {
  const recommendation = await getDepartureGateRecommendation(supabase, { terminal: request.terminal })

  return { action: 'get-departure-gate-recommendation', recommendation }
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
    const userId = await getAuthenticatedUserId(req)
    if (userId == null) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403, headers: corsHeaders })
    }

    const request = parseRequest(await req.json())
    if (request == null) {
      return Response.json({ error: '지원하지 않거나 올바르지 않은 요청입니다.' }, { status: 400, headers: corsHeaders })
    }

    if (request.action === 'get-departure-gate-recommendation') {
      return Response.json(await handleGetDepartureGateRecommendation(request), { headers: corsHeaders })
    }

    if (!(await canReadTripGuidance(userId, request.tripId))) {
      return Response.json({ error: '권한이 없습니다.' }, { status: 403, headers: corsHeaders })
    }

    const result =
      request.action === 'get-guidances' ? await handleGetGuidances(request) : await handleGetGuidance(request)
    return Response.json(result, { headers: corsHeaders })
  } catch (error) {
    return Response.json({ error: (error as Error).message }, { status: 500, headers: corsHeaders })
  }
})
