import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTrips, createTrip, deleteTrip, tripKey } from "./trip.api";
import type { Trip } from "./trip.types";

type CreateTripVars = Omit<Trip, 'id' | 'shareLink' | 'createdAt'> & {
  memberNames?: string[]
}

export function useTrips() {
  const queryClient = useQueryClient();
  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTrips.key(),
    queryFn: getAllTrips,
  });

  const { mutateAsync: create } = useMutation({
    mutationFn: ({ memberNames, ...data }: CreateTripVars) =>
      createTrip(data, memberNames),
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

  return {
    data,
    create,
    remove,
    ...queries,
  };
}

useTrips.key = () => [tripKey];
