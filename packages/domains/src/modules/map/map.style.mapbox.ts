// Mapbox Style Spec (v8). react-native-maps용 pastelMapStyle(map.style.ts)과
// 별개 파일이다 — 두 SDK의 스타일 포맷이 근본적으로 다르다.
export const pastelMapboxStyle = {
  version: 8,
  sources: {
    'mapbox-streets': {
      type: 'vector',
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#f5f0eb' } },
    {
      id: 'water',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'water',
      paint: { 'fill-color': '#c9e8f0' },
    },
    {
      id: 'landuse-park',
      type: 'fill',
      source: 'mapbox-streets',
      'source-layer': 'landuse',
      filter: ['==', ['get', 'class'], 'park'],
      paint: { 'fill-color': '#d4e8c0' },
    },
    {
      id: 'road',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      paint: { 'line-color': '#ffffff', 'line-width': 1.5 },
    },
    {
      id: 'road-highway',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'road',
      filter: ['==', ['get', 'class'], 'motorway'],
      paint: { 'line-color': '#f7e6c8', 'line-width': 2.5 },
    },
    {
      id: 'admin',
      type: 'line',
      source: 'mapbox-streets',
      'source-layer': 'admin',
      paint: { 'line-color': '#d0c0b0', 'line-width': 1 },
    },
    {
      id: 'place-labels',
      type: 'symbol',
      source: 'mapbox-streets',
      'source-layer': 'place_label',
      layout: { 'text-field': ['get', 'name'], 'text-size': 12 },
      paint: { 'text-color': '#7b6f6a', 'text-halo-color': '#f5f0eb', 'text-halo-width': 1 },
    },
  ],
} as const
