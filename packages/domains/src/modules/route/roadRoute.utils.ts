import type { Coordinate } from '../../utils'

// 경로 API 는 한 번에 받을 수 있는 경유지 수가 제한된다.
// 나눈 구간이 끝점을 공유해야 이어붙일 때 경로가 끊기지 않는다.
function splitByMaxSize(waypoints: Coordinate[], maxSize: number): Coordinate[][] {
  const segments: Coordinate[][] = []
  let start = 0

  while (start < waypoints.length - 1) {
    const end = Math.min(start + maxSize, waypoints.length)
    segments.push(waypoints.slice(start, end))
    start = end - 1
  }

  return segments
}

// breakIndices 는 "이 인덱스와 다음 인덱스 사이를 잇지 않는다"는 경계다.
// 교통 구간이 그 경계다 -- 인천에서 오사카를 육로로 뚫으면 실패하고,
// 실패한 자리에 바다를 가로지르는 직선이 그려진다.
// 경계로 먼저 자른 뒤 각 조각에 기존 maxSize 분할을 적용한다.
export function splitIntoSegments(
  waypoints: Coordinate[],
  maxSize: number,
  breakIndices?: number[]
): Coordinate[][] {
  if (breakIndices == null || breakIndices.length === 0) {
    return splitByMaxSize(waypoints, maxSize)
  }

  const boundaries = breakIndices.toSorted((a, b) => a - b)
  const chunks: Coordinate[][] = []
  let start = 0

  for (const boundary of boundaries) {
    chunks.push(waypoints.slice(start, boundary + 1))
    start = boundary + 1
  }
  chunks.push(waypoints.slice(start))

  // 점이 하나뿐인 조각은 그릴 경로가 없다.
  // 경계가 연달아 오면 가운데가 그렇게 된다.
  return chunks.filter((chunk) => chunk.length > 1).flatMap((chunk) => splitByMaxSize(chunk, maxSize))
}
