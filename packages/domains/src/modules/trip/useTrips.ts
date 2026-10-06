import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTrips, createTrip, deleteTrip, tripByUserKey, tripKey } from "./trip.api";
import { leaveTrip } from "../trip-member";
import type { Trip } from "../trip";

type CreateTripVars = Omit<Trip, 'id' | 'shareLink' | 'createdAt' | 'userId' | 'isOverseas'>

export function useTrips() {
  const queryClient = useQueryClient();
  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTrips.key(),
    queryFn: getAllTrips,
  });

  const { mutateAsync: create } = useMutation({
    mutationFn: (data: CreateTripVars) => createTrip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTrips.key() });
    },
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTrips.key() });
    },
  });

  const { mutateAsync: leave } = useMutation({
    mutationFn: async (tripId: string) => {
      const result = await leaveTrip(tripId);
      if (result === 'last_member') {
        await deleteTrip(tripId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTrips.key(), exact: true });
      queryClient.invalidateQueries({ queryKey: [tripKey, tripByUserKey] });
    },
  });

  return {
    data,
    create,
    remove,
    leave,
    ...queries,
  };
}

useTrips.key = () => [tripKey];
