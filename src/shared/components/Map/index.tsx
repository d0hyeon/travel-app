import { use } from 'react';
import { MapTypeContext } from './MapTypeContext';
import { GoogleMapImpl, GoogleMarker, GooglePath } from './google/GoogleMap';
import { Polygon, PolygonLayer, Region } from './PolygonLayer';
import { KakaoMapImpl, KakaoMarker, KakaoPath } from './kakao/KakaoMap';
import type { MapProps, MarkerProps, PathProps } from './types';

export function Map({ type, children, ...props }: MapProps) {
  const MapComponent = type === 'kakao' ? KakaoMapImpl : GoogleMapImpl;

  return (
    <MapTypeContext.Provider value={type}>
      <MapComponent {...props}>{children}</MapComponent>
    </MapTypeContext.Provider>
  );
}


function Marker(props: MarkerProps) {
  const type = use(MapTypeContext);
  return type === 'kakao' ? <KakaoMarker {...props} /> : <GoogleMarker {...props} />;
}

function Path(props: PathProps) {
  const type = use(MapTypeContext);
  return type === 'kakao' ? <KakaoPath {...props} /> : <GooglePath {...props} />;
}

Map.Marker = Marker;
Map.Path = Path;
Map.PolygonLayer = PolygonLayer;
Map.RegionLayer = PolygonLayer;
Map.Polygon = Polygon;
Map.Region = Region;

// Re-export types
export type { AutoFocus, Coordinate, MapProps, MapRef, MapType, MarkerProps, PathProps } from './types';
export type { MapPolygonProps, MapRegionProps, PolygonLayerProps, RegionLayerProps } from './polygon-layer.types';
export { getCountryPolygonCoordinates, getLocationCoordinates } from './polygon-layer.utils';
