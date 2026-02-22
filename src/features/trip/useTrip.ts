import { useSuspenseQuery } from "@tanstack/react-query";
import { getTripById, tripKey } from "./trip.api";
import { assert } from "../../shared/lib/assert";

export function useTrip(id: string) {
  return useSuspenseQuery({
    queryKey: useTrip.key(id),
    queryFn: async () => {
      const data = await getTripById(id);
      assert(data != null, '존재하지 않는 데이터');
      
      return data;
    }
  });

}

useTrip.key = (id: string) => [tripKey, id];