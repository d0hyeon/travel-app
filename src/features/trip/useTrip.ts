import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { deleteTrip, getTripById, tripKey, updateTrip } from "./trip.api";
import { leaveTrip } from "./trip-member/tripMember.api";
import type { Trip } from "./trip.types";
import { getCoordinateByLocation, isLocation } from "~features/location";
import { isOverseasByCoordinate } from "~shared/utils/geo";

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
    update,
    remove,
    leave,
    ...queries
  };
}

useTrip.key = (id: string) => [tripKey, id];
