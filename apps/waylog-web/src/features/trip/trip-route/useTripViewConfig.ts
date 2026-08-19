import { useCallback, useMemo } from "react";
import { useStorageStore } from "~shared/hooks/useStorageStore";
import { useTripCluastering } from "../hooks/useTripCluastering";

interface TripViewConfig {
  isCluasterlingView: boolean;
  isVisibleAllMarkers: boolean;
  isVisibleRouteLegs: boolean;
}

export function useTripViewConfig() {
  const [isCluasterlingView, setIsCluasterlingView] = useTripCluastering();
  const [isVisibleAllMarkers, setIsVisibleAllMarkers] =
    useIsVisibleAllMarkers();
  const [isVisibleRouteLegs, setIsVisibleRouteLegs] = useIsVisibleRouteLegs();

  const setConfig = useCallback(
    ({
      isCluasterlingView,
      isVisibleAllMarkers,
      isVisibleRouteLegs,
    }: Partial<TripViewConfig>) => {
      if (isCluasterlingView != null) setIsCluasterlingView(isCluasterlingView);
      if (isVisibleAllMarkers != null)
        setIsVisibleAllMarkers(isVisibleAllMarkers);
      if (isVisibleRouteLegs != null) setIsVisibleRouteLegs(isVisibleRouteLegs);
    },
    [],
  );

  return useMemo(() => {
    const config = {
      isCluasterlingView,
      isVisibleAllMarkers,
      isVisibleRouteLegs,
    };

    return [config, setConfig] as const;
  }, [isCluasterlingView, isVisibleAllMarkers, isVisibleRouteLegs]);
}

export function useTripViewConfigValue() {
  const [state] = useTripViewConfig();

  return state;
}

function useIsVisibleAllMarkers() {
  return useStorageStore("trip-is-visible-markers", false);
}

function useIsVisibleRouteLegs() {
  return useStorageStore("trip-is-visible-legs", false);
}
