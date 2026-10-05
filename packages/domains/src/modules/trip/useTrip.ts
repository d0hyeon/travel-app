import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
// 배럴을 경유해 import 한다. 테스트가 vi.spyOn 으로 이 모듈의 함수를 대체할 수 있어야 한다.
import { deleteTrip, getTripById, tripKey, updateTrip } from "./trip.api";
import { leaveTrip } from "../trip-member";
import type { Trip } from "../trip";

export function useTrip(id: string) {
  const queryClient = useQueryClient();

  const { data, ...queries } = useSuspenseQuery({
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
    data,
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
    leave: Object.assign(leave.mutateAsync, leave),
    ...queries
  };
}

useTrip.key = (id: string) => [tripKey, id];
