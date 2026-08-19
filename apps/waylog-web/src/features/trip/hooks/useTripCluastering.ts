import { useStorageStore } from "~shared/hooks/useStorageStore";

export function useTripCluastering() {
  return useStorageStore<boolean>('trip-cluastering', false);
}