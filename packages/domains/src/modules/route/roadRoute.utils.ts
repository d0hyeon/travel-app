import type { Coordinate } from '../../utils'

// 경로 API 는 한 번에 받을 수 있는 경유지 수가 제한된다.
// 나눈 구간이 끝점을 공유해야 이어붙일 때 경로가 끊기지 않는다.
export function splitIntoSegments(waypoints: Coordinate[], maxSize: number): Coordinate[][] {
  const segments: Coordinate[][] = []
  let start = 0

  while (start < waypoints.length - 1) {
    const end = Math.min(start + maxSize, waypoints.length)
    segments.push(waypoints.slice(start, end))
    start = end - 1
  }

  return segments
}
