import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllTrips, createTrip, tripKey } from "./trip.api";

export function useTrips() {
  const queryClient = useQueryClient();
  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTrips.key(),
    queryFn: getAllTrips,
  });

  const { mutate: create } = useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: useTrips.key() });
    },
  });

  return {
    data,
    create,
    ...queries,
  };
}

useTrips.key = () => [tripKey];
