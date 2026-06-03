import type { VercelRequest, VercelResponse } from '@vercel/node'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

interface Coordinate {
  lat: number
  lng: number
}

function parseWaypoints(raw: string): Coordinate[] {
  return raw.split('|').map((pair) => {
    const [lng, lat] = pair.split(',').map(Number)
    return { lat, lng }
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { waypoints: waypointsRaw, region } = req.query

  if (
    typeof waypointsRaw !== 'string' ||
    (region !== 'korea' && region !== 'global')
  ) {
    return res.status(400).json({ error: 'Invalid parameters' })
  }

  const waypoints = parseWaypoints(waypointsRaw)

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/road-directions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ waypoints, region }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    return res.status(response.status).json({ error: text })
  }

  const data = await response.json()

  res.setHeader('Cache-Control', 'public, s-maxage=604800')
  return res.status(200).json(data)
}
