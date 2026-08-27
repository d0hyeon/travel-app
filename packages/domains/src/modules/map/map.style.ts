// 지도 스타일은 웹·앱이 같은 JSON 규격을 쓴다.
// 웹은 google.maps.MapTypeStyle[], 앱은 react-native-maps 의 customMapStyle 로 들어간다.
export interface MapStyleRule {
  featureType?: string;
  elementType?: string;
  stylers: Array<Record<string, string | number>>;
}

/**
 * 카카오맵처럼 채도를 낮춘 파스텔 바탕. 모든 지도의 기본값이다.
 */
export const pastelMapStyle: MapStyleRule[] = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0eb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7b6f6a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0eb' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7aa8b5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8ddd5' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f7e6c8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8c89a' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#b07c4a' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#a09080' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#b0a090' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e8f0d8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#7a9060' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4e8c0' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6a9050' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e8d8f0' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#8070a0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d0c0b0' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#a09080' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#ede8e0' }] },
];

/**
 * 방문 지역을 색으로 읽는 화면용. 도로망이 지역 폴리곤 위에 겹쳐
 * 혈관처럼 보이므로 도로와 교통을 지운다.
 */
export const visitedRegionMapStyle: MapStyleRule[] = [
  ...pastelMapStyle,
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];
