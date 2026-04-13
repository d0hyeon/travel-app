/**
 * @deprecated Map 컴포넌트를 사용하세요.
 * @example
 * import { Map } from '~shared/components/Map';
 * <Map type="kakao" ...>
 *   <Map.Marker />
 *   <Map.Path />
 * </Map>
 */
import type { BoxProps } from '@mui/material';
import type { ReactNode, Ref } from 'react';
import { Map, type MapRef } from './Map';

type AutoFocus = 'marker' | 'path' | false;

export interface KakaoMapProps extends Omit<BoxProps, 'ref' | 'autoFocus'> {
  defaultCenter?: { lat: number; lng: number };
  ref?: Ref<KakaoMapRef>;
  children?: ReactNode;
  autoFocus?: AutoFocus;
  clustering?: boolean;
  clusterGridSize?: number;
}

export type KakaoMapRef = MapRef;

/** @deprecated Map 컴포넌트를 사용하세요 */
export function KakaoMap(props: KakaoMapProps) {
  return <Map type="kakao" {...props} />;
}

KakaoMap.Marker = Map.Marker;
KakaoMap.Path = Map.Path;
