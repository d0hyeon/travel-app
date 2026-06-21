import { useCallback, useMemo } from "react";
import { useStorageStore } from "~shared/hooks/useStorageStore";
import { useTripCluastering } from "../hooks/useTripCluastering";

interface TripViewConfig {
  isCluasterlingView: boolean;
  isVisibleAllMarkers: boolean;
}

export function useTripViewConfig() {
  const [isCluasterlingView, setIsCluasterlingView] = useTripCluastering();
  const [isVisibleAllMarkers, setIsVisibleAllMarkers] = useIsVisibleAllMarkers();

  const setConfig = useCallback(
    ({ isCluasterlingView, isVisibleAllMarkers }: Partial<TripViewConfig>) => {
      if (isCluasterlingView != null) setIsCluasterlingView(isCluasterlingView);
      if (isVisibleAllMarkers != null) setIsVisibleAllMarkers(isVisibleAllMarkers);
    },
    []);
  
  return useMemo(() => {
    const config = { isCluasterlingView, isVisibleAllMarkers };
    
    return [config, setConfig] as const
  }, [isCluasterlingView, isVisibleAllMarkers])
}

export function useTripViewConfigValue() {
  const [state] = useTripViewConfig();
  
  return state;
}

function useIsVisibleAllMarkers() {
  return useStorageStore('trip-is-visible-markers', false)
}