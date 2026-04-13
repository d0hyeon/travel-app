import { Box, CircularProgress, type BoxProps } from '@mui/material';
import { Suspense, use } from 'react';
import { lazy } from '~shared/utils/react';
import { arrayIncludes } from '~shared/utils/types';
import { SwitchCase } from '../SwitchCase';
import { MapTypeContext } from './MapTypeContext';
import { Polygon, PolygonLayer, Region } from './PolygonLayer';
import type { MapProps, MarkerProps, PathProps } from './types';

const KakaoMap = lazy(() => import('./kakao/KakaoMap'));
const KakaoMarker = lazy(() => import('./kakao/KakaoMapMarker'));
const KakaoPath = lazy(() => import('./kakao/KakaoMapPath'));

const GoogleMap = lazy(() => import('./google/GoogleMap'));
const GoogleMarker = lazy(() => import('./google/GoogleMapMarker'));
const GooglePath = lazy(() => import('./google/GoogleMapPath'));

interface Props extends MapProps, Omit<BoxProps, 'autoFocus' | 'ref'> {
  type: 'kakao' | 'google';
}
const MAP_PROP_KEYS: (keyof MapProps)[] = ['autoFocus', 'children', 'clusterGridSize', 'clustering', 'defaultCenter', 'ref', 'showMyLocation']

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
            {...omit(props, MAP_PROP_KEYS)}
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

Map.Marker = Marker;
Map.Path = Path;
Map.PolygonLayer = PolygonLayer;
Map.RegionLayer = PolygonLayer;
Map.Polygon = Polygon;
Map.Region = Region;


function omit<T extends {}, Key extends keyof T>(obj: T, keys: Key[]) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !arrayIncludes(keys, key))
  ) as Omit<T, Key>;
}

export type { MapPolygonProps, MapRegionProps, PolygonLayerProps, RegionLayerProps } from './polygon-layer.types';
export { getCountryPolygonCoordinates, getLocationCoordinates } from './polygon-layer.utils';
export type { LocationCoordinateLevel } from './polygon-layer.utils';
export type { AutoFocus, Coordinate, MapProps, MapRef, MapType, MarkerProps, PathProps } from './types';
