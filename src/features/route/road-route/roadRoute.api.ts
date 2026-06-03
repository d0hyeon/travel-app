import { supabase } from '~api/client'

interface Coordinate {
  lat: number
  lng: number
}

function splitIntoSegments(waypoints: Coordinate[], maxSize: number): Coordinate[][] {
  const segments: Coordinate[][] = []
  let start = 0
  while (start < waypoints.length - 1) {
    const end = Math.min(start + maxSize, waypoints.length)
    segments.push(waypoints.slice(start, end))
    start = end - 1
  }
  return segments
}

function mergeSegments(segments: Coordinate[][]): Coordinate[] {
  if (segments.length === 0) return []
  if (segments.length === 1) return segments[0]
  const result = [...segments[0]]
  for (let i = 1; i < segments.length; i++) {
    result.push(...segments[i].slice(1))
  }
  return result
}

async function fetchSegment(waypoints: Coordinate[], region: 'korea' | 'global'): Promise<Coordinate[]> {
  try {
    const { data, error } = await supabase.functions.invoke('road-directions', {
      body: { waypoints, region },
    })
    if (error) return waypoints
    return data?.coordinates ?? waypoints
  } catch {
    return waypoints
  }
}

export async function getRoadDirections(waypoints: Coordinate[], region: 'korea' | 'global'): Promise<Coordinate[]> {
  if (waypoints.length < 2) return waypoints
  if (waypoints.length <= 7) return fetchSegment(waypoints, region)

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, region)))
  return mergeSegments(results)
}
