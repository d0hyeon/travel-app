import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

interface Coordinate {
  lat: number
  lng: number
}

function parseWaypoints(raw: string): Coordinate[] | null {
  const pairs = raw.split('|')
  if (pairs.length < 2) return null
  const coords: Coordinate[] = []
  for (const pair of pairs) {
    const parts = pair.split(',')
    if (parts.length !== 2) return null
    const [lng, lat] = parts.map(Number)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
    coords.push({ lat, lng })
  }
  return coords
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration' })
  }

  const { waypoints: waypointsRaw, region } = req.query

  if (
    typeof waypointsRaw !== 'string' ||
    (region !== 'korea' && region !== 'global')
  ) {
    return res.status(400).json({ error: 'Invalid parameters' })
  }

  const waypoints = parseWaypoints(waypointsRaw)
  if (!waypoints) {
    return res.status(400).json({ error: 'Invalid waypoints format' })
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/road-directions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ waypoints, region }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.error('Upstream error:', response.status, text)
      return res.status(response.status).json({ error: 'Upstream request failed' })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (e) {
    console.error('Fetch error:', e)
    return res.status(502).json({ error: 'Upstream request failed' })
  }
}
