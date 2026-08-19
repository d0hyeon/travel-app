import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
// 배럴을 경유해 import 한다. 테스트가 vi.spyOn 으로 이 모듈의 함수를 대체할 수 있어야 한다.
import { deleteTrip, getTripById, tripKey, updateTrip } from "./index";
import { leaveTrip } from "../trip-member";
import type { Trip } from "../trip";
import { getCoordinateByLocation, isLocation } from "../location";
import { isOverseasByCoordinate } from "../utils";

export function useTrip(id: string) {
  const queryClient = useQueryClient();

  const { data, ...queries } = useSuspenseQuery({
    queryKey: useTrip.key(id),
    queryFn: () => getTripById(id),
  });
  const isOverseas = data.destinations.some(x => {
    if (!isLocation(x)) return false;

    const coordinate = getCoordinateByLocation(x);
    return isOverseasByCoordinate(coordinate.lat, coordinate.lng)
  })

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
    data: { isOverseas, ...data },
    update: Object.assign(update.mutateAsync, update),
    remove: Object.assign(remove.mutateAsync, remove),
    leave: Object.assign(leave.mutateAsync, leave),
    ...queries
  };
}

useTrip.key = (id: string) => [tripKey, id];
