import { useStorageState } from "~shared/hooks/useStorageState";

export function useTripCluastering() {
  return useStorageState<boolean>('trip-cluastering', false);
}