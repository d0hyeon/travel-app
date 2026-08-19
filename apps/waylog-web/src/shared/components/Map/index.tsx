import { Box, CircularProgress, type BoxProps } from '@mui/material';
import { Suspense, use } from 'react';
import { omit } from '@waylog/domains/utils';
import { lazy } from '~shared/utils/react';
import { SwitchCase } from '../SwitchCase';
import { MapTypeContext } from './MapTypeContext';
import { Polygon, PolygonLayer, Region } from './PolygonLayer';
import { PolylineContext } from './PolylineContext';
import type { MapProps, MarkerProps, PathProps, PolylineLineProps, PolylineProps } from './types';
import { useMapZoomLevel as useGoogleMapZoomLevel } from './google/useMapZoomLevel'
import { useMapZoomLevel as useKakaoMapZoomLevel } from './kakao/useMapZoomLevel'

const KakaoMap = lazy(() => import('./kakao/KakaoMap'));
const KakaoMarker = lazy(() => import('./kakao/KakaoMapMarker'));
const KakaoPath = lazy(() => import('./kakao/KakaoMapPath'));

const GoogleMap = lazy(() => import('./google/GoogleMap'));
const GoogleMarker = lazy(() => import('./google/GoogleMapMarker'));
const GooglePath = lazy(() => import('./google/GoogleMapPath'));

const KakaoPolylineLine = lazy(() => import('./kakao/KakaoMapPolylineLine'));
const GooglePolylineLine = lazy(() => import('./google/GoogleMapPolylineLine'));

interface Props extends MapProps, Omit<BoxProps, 'autoFocus' | 'ref' | 'children'> {
  type: 'kakao' | 'google';
}
const MAP_PROP_KEYS: (keyof MapProps)[] = ['autoFocus', 'children', 'clusterGridSize', 'clustering', 'defaultCenter', 'center', 'ref']

export function Map({ type, ...props }: Props) {
  return (
    <MapTypeContext.Provider value={type}>
      <Suspense
        fallback={(
          <Box
            bgcolor={theme => theme.palette.grey[100]}
            display="flex"
            alignItems="center"
            justifyContent="center"
            {...omit(props, [...MAP_PROP_KEYS, 'autoFocus', 'ref', 'children'])}
          >
            <CircularProgress />
          </Box>
        )}
      >
        <SwitchCase
          value={type}
          cases={{
            'kakao': () => <KakaoMap {...props} />,
            'google': () => <GoogleMap {...props} />
          }}
        />
      </Suspense>

    </MapTypeContext.Provider>
  );
}


function Marker(props: MarkerProps) {
  const type = use(MapTypeContext);

  return (
    <Suspense>
      <SwitchCase
        value={type}
        cases={{
          kakao: () => <KakaoMarker {...props} />,
          google: () => <GoogleMarker {...props} />,
        }}
      />
    </Suspense>
  )
}

function Path(props: PathProps) {
  const type = use(MapTypeContext);

  return (
    <Suspense>
      <SwitchCase
        value={type}
        cases={{
          kakao: () => <KakaoPath {...props} />,
          google: () => <GooglePath {...props} />,
        }}
      />
    </Suspense>
  )
}

// 여러 Line을 한 경로로 묶고 공통 선 스타일을 자식에 전달한다
function Polyline({ children, strokeColor, strokeWeight, strokeOpacity, strokeStyle }: PolylineProps) {
  return (
    <PolylineContext.Provider value={{ strokeColor, strokeWeight, strokeOpacity, strokeStyle }}>
      {children}
    </PolylineContext.Provider>
  );
}

function PolylineLine(props: PolylineLineProps) {
  const type = use(MapTypeContext);

  return (
    <Suspense>
      <SwitchCase
        value={type}
        cases={{
          kakao: () => <KakaoPolylineLine {...props} />,
          google: () => <GooglePolylineLine {...props} />,
        }}
      />
    </Suspense>
  )
}

const GOOGLE_MAX_SCALE_DOWN_LEVEL = 22;

export function useMapZoomLevel() {
  const type = use(MapTypeContext);

  const googleZoom = useGoogleMapZoomLevel({ enabled: type === 'google' });
  const kakaoZoom = useKakaoMapZoomLevel({ enabled: type === 'kakao' });

  /** @NOTE 카카오는 레벨이 작을수록 확대 / 구글은 레벨이 작을수록 축소  */
  if (type === 'google') return GOOGLE_MAX_SCALE_DOWN_LEVEL - googleZoom;
  return kakaoZoom;
}

Polyline.Line = PolylineLine;

Map.Marker = Marker;
Map.Path = Path;
Map.Polyline = Polyline;
Map.PolygonLayer = PolygonLayer;
Map.RegionLayer = PolygonLayer;
Map.Polygon = Polygon;
Map.Region = Region;




export type { MapPolygonProps, MapRegionProps, PolygonLayerProps, RegionLayerProps } from './polygon-layer.types';
export { getCountryPolygonCoordinates, getLocationCoordinates } from './polygon-layer.utils';
export type { LocationCoordinateLevel } from './polygon-layer.utils';
export type { AutoFocus, Coordinate, MapBounds, MapProps, MapRef, MapType, MarkerProps, PathProps } from './types';

