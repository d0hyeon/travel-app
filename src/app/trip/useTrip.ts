import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getTripById, tripKey, updateTrip } from "./trip.api";
import { assert } from '~shared/utils/assert';
import type { Trip } from "./trip.types";

export function useTrip(id: string) {
  const queryClient = useQueryClient();

  const query = useSuspenseQuery({
    queryKey: useTrip.key(id),
    queryFn: async () => {
      const data = await getTripById(id);
      assert(data != null, '존재하지 않는 데이터');
      return data;
    }
  });

  const update = useMutation({
    mutationFn: (data: Partial<Omit<Trip, 'id' | 'createdAt'>>) => updateTrip(id, data),
    onSuccess: (updated) => {
      if (updated) {
        queryClient.setQueryData(useTrip.key(id), updated);
      }
    }
  });

  return {
    ...query,
    update,
  };
}

useTrip.key = (id: string) => [tripKey, id];
