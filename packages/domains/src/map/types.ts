import type { ReactNode, Ref } from 'react';
import type { Coordinate } from '@waylog/domains/utils';

export type { Coordinate };

// 웹이 쓰는 지도 제공자. 소비자가 고를 수 있는 값이다.
export type MapProvider = 'kakao' | 'google';

// 구현 종류 전체. 앱은 react-native-maps 구현을 갖는다.
export type MapType = MapProvider | 'native';

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
export interface MapRenderProps {
  zoom: number;
}
export interface MapProps  {
  defaultCenter?: Coordinate;
  center?: Coordinate;
  autoFocus?: AutoFocus;
  children?: ReactNode | ((props: MapRenderProps) => ReactNode);
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
  outlined?: boolean;
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

// 여러 간선(Line)을 하나의 논리적 경로로 묶는 그룹. 선 스타일을 소유해 자식 Line에 전달한다.
export interface PolylineProps {
  children?: ReactNode;
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  strokeStyle?: string;
}

// Polyline 그룹 안의 개별 간선. 자기 좌표열로 폴리라인을 그리고 좌표열 중앙에 라벨을 띄운다.
export interface PolylineLineProps {
  coordinates: Coordinate[];
  label?: string;
}

// Polyline이 자식 Line에 전달하는 공통 선 스타일
export interface PolylineStyle {
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
  outlined?: boolean;
  thumbnailUrl?: string;
  onClick?: () => void;
  onContextMenu?: () => void;
}
