import { createContext } from "react";
import type { AutoFocus, Coordinate, MarkerData } from "./types";

export interface MapContextValue<MapInstance> {
  map: MapInstance | null;
  extendBound: (value: Coordinate) => void;
  registerMarker: (data: MarkerData) => void;
  unregisterMarker: (id: string) => void;
  config: { autoFocus: AutoFocus; clustering: boolean; clusterGridSize: number };
}
export const KakaoMapContext = createContext<MapContextValue<kakao.maps.Map> | null>(null);
export const GoogleMapContext = createContext<MapContextValue<google.maps.Map> | null>(null);