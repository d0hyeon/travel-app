import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deleteTrip, getTripById, tripKey, updateTrip } from "./trip.api";
import { leaveTrip } from "./trip-member/tripMember.api";
import type { Trip } from "./trip.types";

export function useTrip(id: string) {
  const queryClient = useQueryClient();

  const query = useSuspenseQuery({
    queryKey: useTrip.key(id),
    queryFn: () => getTripById(id),
  });

  const update = useMutation({
    mutationFn: (data: Partial<Omit<Trip, 'id' | 'createdAt'>>) => updateTrip(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(useTrip.key(id), updated);
      }
    }
  });

  const remove = useMutation({
    mutationFn: () => deleteTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tripKey] });
    }
  });

  const leave = useMutation({
    mutationFn: () => leaveTrip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tripKey] });
    }
  });

  return {
    ...query,
    update,
    remove,
    leave,
  };
}

useTrip.key = (id: string) => [tripKey, id];
