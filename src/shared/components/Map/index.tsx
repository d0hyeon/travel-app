import { use } from 'react';
import { MapTypeContext } from './MapTypeContext';
import { GoogleMapImpl, GoogleMarker, GooglePath } from './google/GoogleMap';
import { GoogleVisitLayer, type GoogleVisitLayerProps } from './google/GoogleVisitLayer';
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

function VisitLayer(props: GoogleVisitLayerProps) {
  const type = use(MapTypeContext);
  // Kakao Maps는 Data Layer 미지원
  return type === 'google' ? <GoogleVisitLayer {...props} /> : null;
}

Map.Marker = Marker;
Map.Path = Path;
Map.VisitLayer = VisitLayer;

// Re-export types
export type { AutoFocus, Coordinate, MapProps, MapRef, MapType, MarkerProps, PathProps } from './types';
