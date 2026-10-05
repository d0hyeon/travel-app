import { useSuspenseQuery } from "@tanstack/react-query";
import { tripByUserKey, tripKey } from "@waylog/domains/modules/trip";
import { getUserTrips } from "./user-profile.api";

export function useUserTrips(userId: string) {
  return useSuspenseQuery({
    queryKey: useUserTrips.key(userId),
    queryFn: () => getUserTrips(userId),
  });
}
useUserTrips.key = (userId?: string) => {
  if (userId) return [tripKey, tripByUserKey, userId];
  return [tripKey, tripByUserKey];
};
