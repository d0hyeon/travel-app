// 카카오 모빌리티 API - 자동차 길찾기
// https://developers.kakaomobility.com/docs/navi-api/directions/

const KAKAO_REST_KEY = import.meta.env.VITE_KAKAO_REST_KEY

interface Coordinate {
  lat: number
  lng: number
}

interface DirectionsResponse {
  routes: Array<{
    result_code: number
    result_msg: string
    sections: Array<{
      roads: Array<{
        vertexes: number[] // [lng, lat, lng, lat, ...] 형식
      }>
    }>
  }>
}

/**
 * 여러 경유지를 포함한 도로 기반 경로 좌표를 반환
 * 카카오 API는 경유지 최대 5개만 지원하므로, 그 이상일 경우 여러 구간으로 나눠서 호출
 * @param waypoints 경유지 좌표 배열 (최소 2개: 출발지, 도착지)
 * @returns 도로를 따라가는 좌표 배열
 */
export async function getDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (!KAKAO_REST_KEY) {
    console.warn('VITE_KAKAO_REST_KEY가 설정되지 않았습니다. 직선 경로를 사용합니다.')
    return waypoints
  }

  if (waypoints.length < 2) {
    return waypoints
  }

  // 7개 이하면 한 번에 호출 (출발 + 경유지 5개 + 도착)
  if (waypoints.length <= 7) {
    return fetchSingleSegment(waypoints)
  }

  // 7개 초과면 여러 구간으로 나눠서 호출
  const segments = splitIntoSegments(waypoints, 7)
  const results: Coordinate[][] = []

  for (const segment of segments) {
    const segmentPath = await fetchSingleSegment(segment)
    results.push(segmentPath)
  }

  // 구간별 결과를 합침 (중복 제거: 이전 구간의 마지막 점 = 다음 구간의 첫 점)
  return mergeSegments(results)
}

/**
 * waypoints를 maxSize 크기의 겹치는 구간들로 분할
 * 예: [1,2,3,4,5,6,7,8,9] maxSize=7 → [[1,2,3,4,5,6,7], [7,8,9]]
 */
function splitIntoSegments(waypoints: Coordinate[], maxSize: number): Coordinate[][] {
  const segments: Coordinate[][] = []
  let start = 0

  while (start < waypoints.length - 1) {
    const end = Math.min(start + maxSize, waypoints.length)
    segments.push(waypoints.slice(start, end))
    start = end - 1 // 다음 구간은 이전 구간의 마지막 점에서 시작
  }

  return segments
}

/**
 * 여러 구간의 좌표를 하나로 합침 (연결 지점 중복 제거)
 */
function mergeSegments(segments: Coordinate[][]): Coordinate[] {
  if (segments.length === 0) return []
  if (segments.length === 1) return segments[0]

  const result = [...segments[0]]
  for (let i = 1; i < segments.length; i++) {
    // 첫 번째 점은 이전 구간의 마지막 점과 같으므로 제외
    result.push(...segments[i].slice(1))
  }
  return result
}

async function fetchSingleSegment(waypoints: Coordinate[]): Promise<Coordinate[]> {
  const origin = waypoints[0]
  const destination = waypoints[waypoints.length - 1]
  const viaPoints = waypoints.slice(1, -1)

  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  })

  if (viaPoints.length > 0) {
    const waypointsStr = viaPoints
      .map((p) => `${p.lng},${p.lat}`)
      .join('|')
    params.set('waypoints', waypointsStr)
  }

  try {
    const response = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?${params}`,
      {
        headers: {
          Authorization: `KakaoAK ${KAKAO_REST_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error('카카오 모빌리티 API 오류:', response.status)
      return waypoints
    }

    const data: DirectionsResponse = await response.json()

    if (data.routes[0]?.result_code !== 0) {
      console.warn('경로 탐색 실패:', data.routes[0]?.result_msg)
      return waypoints
    }

    const coordinates: Coordinate[] = []

    for (const section of data.routes[0].sections) {
      for (const road of section.roads) {
        const vertexes = road.vertexes
        for (let i = 0; i < vertexes.length; i += 2) {
          coordinates.push({
            lng: vertexes[i],
            lat: vertexes[i + 1],
          })
        }
      }
    }

    return coordinates.length > 0 ? coordinates : waypoints
  } catch (error) {
    console.error('경로 탐색 중 오류:', error)
    return waypoints
  }
}
