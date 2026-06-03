interface Coordinate {
  lat: number
  lng: number
}

function formatCoord(n: number): string {
  return Number.isInteger(n) ? `${n}.0` : `${n}`
}

function serializeWaypoints(waypoints: Coordinate[]): string {
  return waypoints.map((p) => `${formatCoord(p.lng)},${formatCoord(p.lat)}`).join('|')
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
    const params = new URLSearchParams({
      waypoints: serializeWaypoints(waypoints),
      region,
    })
    const response = await fetch(`/api/road-directions?${params}`)
    if (!response.ok) return waypoints
    const data = await response.json()
    return data?.coordinates ?? waypoints
  } catch {
    return waypoints
  }
}

export async function getRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) return waypoints
  if (waypoints.length <= 7) return fetchSegment(waypoints, 'korea')

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, 'korea')))
  return mergeSegments(results)
}

export async function getGlobalRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) return waypoints
  if (waypoints.length <= 7) return fetchSegment(waypoints, 'global')

  const segments = splitIntoSegments(waypoints, 7)
  const results = await Promise.all(segments.map((s) => fetchSegment(s, 'global')))
  return mergeSegments(results)
}
