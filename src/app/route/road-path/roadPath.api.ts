import { loadGoogleMaps } from "~shared/components/Map/google/loader";
import { supabase } from "~shared/lib/supabase"


interface Coordinate {
  lat: number
  lng: number
}

export /**
 * Google Directions API를 사용하여 경로 좌표 반환
 */
async function getGlobalRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) {
    return waypoints;
  }

  await loadGoogleMaps();

  return new Promise((resolve) => {
    const directionsService = new google.maps.DirectionsService();

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints: intermediateWaypoints.map((wp) => ({
        location: { lat: wp.lat, lng: wp.lng },
        stopover: true,
      })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // 순서 유지
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        const coordinates: Coordinate[] = [];

        // 모든 leg의 step에서 path 추출
        result.routes[0]?.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            step.path?.forEach((point) => {
              coordinates.push({
                lat: point.lat(),
                lng: point.lng(),
              });
            });
          });
        });

        resolve(coordinates.length > 0 ? coordinates : waypoints);
      } else {
        console.error('Google Directions 오류:', status);
        resolve(waypoints); // fallback: 직선
      }
    });
  });
}

/**
 * 여러 경유지를 포함한 도로 기반 경로 좌표를 반환
 * 카카오 API는 경유지 최대 5개만 지원하므로, 그 이상일 경우 여러 구간으로 나눠서 호출
 * @param waypoints 경유지 좌표 배열 (최소 2개: 출발지, 도착지)
 * @returns 도로를 따라가는 좌표 배열
 */
export async function getRoadDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
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
  try {
    const { data, error } = await supabase.functions.invoke('kakao-directions', {
      body: { waypoints },
    })

    if (error) {
      console.error('Edge Function 호출 오류:', error)
      return waypoints
    }

    return data?.coordinates ?? waypoints
  } catch (error) {
    console.error('경로 탐색 중 오류:', error)
    return waypoints
  }
}