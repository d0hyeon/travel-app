import { pastelMapStyle, type MapStyleRule } from '@waylog/domains/modules/map'

/**
 * 방문 지역을 색으로 읽는 지도. 도로·교통·POI 가 지역 위에 겹쳐
 * 혈관처럼 보이므로 지운다.
 */
export const visitedRegionMapStyle: MapStyleRule[] = [
  ...pastelMapStyle,
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]
