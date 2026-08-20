import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { createChecklist, getChecklist, path, removeChecklist, updateChecklist, type CreateChecklist, type UpdateChecklist } from "./tripChecklist.api";
import type { TripChecklist } from "./tripChecklist.type";
import { getUpcomingDeadlines } from "./tripChecklist.utils";

const now = Date.now();


export function useTripChecklist(tripId: string) {
  const client = useQueryClient();

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripChecklist.key(tripId),
    queryFn: async () => {
      const data = await getChecklist(tripId)
      return data.toSorted((_, item) => item.isCompleted ? -1 : 1)
    },
  });

  const deadlines = useMemo(() => getUpcomingDeadlines(data, now), [data]);

  const { mutateAsync: add } = useMutation({
    mutationFn: (params: Omit<CreateChecklist, 'tripId'>) => {
      return createChecklist({ tripId, ...params })
    },
    onSuccess: () => refetch(),
  })

  const { mutateAsync: update } = useMutation({
    mutationFn: async (params: Omit<UpdateChecklist, 'tripId'>) => {
      await updateChecklist(params);
      
      return { refetch };
    },
    onSuccess: (_, params) => {
      client.setQueryData<TripChecklist[]>(useTripChecklist.key(tripId), (curr) => {
        if (curr == null) return;
        return curr.map(x => (x.id === params.id
          ? { ...x, ...params }
          : x
        ))
      })
    }
  })

  const { mutateAsync: remove } = useMutation({
    mutationFn: (id: string) => {
      return removeChecklist(id)
    },
    onSuccess: () => refetch(),
  });

  return { data: { checklist: data, deadlines }, refetch, add, update, remove, ...queries };
}

useTripChecklist.key = (tripId: string) => {
  return [path, tripId];
}