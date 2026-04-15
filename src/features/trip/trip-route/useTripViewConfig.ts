import { useStorageState } from "~shared/hooks/useStorageState";
import { useTripCluastering } from "../hooks/useTripCluastering";
import { useCallback, useMemo } from "react";

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

function useIsVisibleAllMarkers() {
  return useStorageState('trip-is-visible-markers', false)
}