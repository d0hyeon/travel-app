import { useQuery } from '@tanstack/react-query'
import { getDirections } from '../lib/kakaoMobility'

interface Coordinate {
  lat: number
  lng: number
}

/**
 * 도로 기반 경로 좌표를 가져오는 hook
 * 결과는 캐싱되어 같은 경유지 조합에 대해 API를 재호출하지 않음
 */
export function useRoadPath(waypoints: Coordinate[] | undefined) {
  const { data } = useQuery({
    queryKey: ['roadPath', waypoints?.map((p) => `${p.lat},${p.lng}`).join('|')],
    queryFn: () => getDirections(waypoints!),
    enabled: !!waypoints && waypoints.length >= 2,
    staleTime: Infinity, // 경로는 자주 변하지 않으므로 캐시 유지
    gcTime: 1000 * 60 * 30, // 30분간 캐시 유지
    refetchInterval: false,
    refetchOnMount: false,
  })

  // 데이터가 없으면 원래 waypoints 반환 (직선 fallback)
  return data ?? waypoints
}
