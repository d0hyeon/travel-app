import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTrips, createTrip, deleteTrip, tripKey } from "./trip.api";

export function useTrips() {
  const queryClient = useQueryClient();
  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTrips.key(),
    queryFn: getAllTrips,
  });

  const { mutateAsync: create } = useMutation({
    mutationFn: createTrip,
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
