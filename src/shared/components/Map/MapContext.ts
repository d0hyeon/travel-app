import { createContext, use } from "react";
import type { AutoFocus, Coordinate } from "./types";
import { assert } from "~shared/utils/types";

export interface MapContextValue<MapInstance> {
  map: MapInstance | null;
  extendBound: (value: Coordinate) => void;
  config: { autoFocus: AutoFocus; clustering: boolean; };
}

export const KakaoMapContext = createContext<MapContextValue<kakao.maps.Map> | null>(null);
export const GoogleMapContext = createContext<MapContextValue<google.maps.Map> | null>(null);

export function useMapContext<MapInstance>(Context: React.Context<MapContextValue<MapInstance> | null>) {
  const context = use(Context);
  assert(!!context, 'MapContext is not available. Make sure your component is wrapped with the corresponding Map provider.');

  if (context.map == null) {
    const map = use(waitForInitialize(() => context.map));
    return { ...context, map };
  }
  
  return { ...context, map: context.map }
}

function waitForInitialize<T>(getNode: () => T | null | undefined) {
  const node = getNode();
  if (node == null) {
    const { promise, resolve } = Promise.withResolvers<T>();
    const timerId = setInterval(() => {
      const node = getNode();
      if (node != null) {
        clearInterval(timerId);
        resolve(node);
      }
    }, 10);
    return promise;
  }

  return Promise.resolve(node);
}