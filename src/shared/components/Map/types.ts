import type { ReactNode, Ref } from 'react';
import type { Coordinate } from '~shared/model/coordinate.model';
export type { Coordinate } from '~shared/model/coordinate.model';

export type MapType = 'kakao' | 'google';

export type AutoFocus = 'marker' | 'path' | false;

export interface MapRef {
  panTo: (lat: number, lng: number, level?: number) => void;
  relayout: () => void;
  focus: () => void;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapProps  {
  defaultCenter?: Coordinate;
  center?: Coordinate;
  autoFocus?: AutoFocus;
  children?: ReactNode;
  ref?: Ref<MapRef>;
  clustering?: boolean;
  clusterGridSize?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
}

export type MarkerColor = 'default' | 'selected' | 'disabled' | (string & {});

export interface MarkerProps {
  id?: string;
  lat: number;
  lng: number;
  label?: string;
  tooltip?: string | string[];
  variant?: 'pin' | 'circle';
  color?: MarkerColor;
  opacity?: number;
  thumbnailUrl?: string;
  onClick?: (marker: MarkerCallbackData) => void;
  onContextMenu?: (marker: MarkerCallbackData) => void;
}

export interface MarkerCallbackData {
  lat: number;
  lng: number;
  label?: string;
  variant?: 'pin' | 'circle';
}

export interface PathProps {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: string;
}

// 내부 마커 레지스트리용
/** @package */
export interface MarkerData {
  id: string;
  position: Coordinate;
  label?: string;
  tooltip?: string | string[];
  variant?: 'pin' | 'circle';
  color?: MarkerColor;
  opacity?: number;
  thumbnailUrl?: string;
  onClick?: () => void;
  onContextMenu?: () => void;
}
