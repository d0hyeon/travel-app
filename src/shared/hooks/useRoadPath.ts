import { useDirections } from './useDirections';

interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * @deprecated useDirections를 사용하세요.
 * @example
 * import { useDirections } from '~shared/hooks/useDirections';
 * const path = useDirections({ type: 'kakao', waypoints });
 */
export function useRoadPath(waypoints: Coordinate[] | undefined) {
  return useDirections({ type: 'kakao', waypoints });
}
