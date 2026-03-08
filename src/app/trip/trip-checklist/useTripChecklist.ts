import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { differenceInDays, getTime } from "date-fns";
import { useMemo } from "react";
import type { PickRequired } from "~shared/utils/types";
import { createChecklist, getChecklist, path, removeChecklist, updateChecklist, type CreateChecklist, type UpdateChecklist } from "./tripChecklist.api";
import type { TripChecklist } from "./tripChecklist.type";
import { WARNING_DAYS_FROM_DEADLINE } from "./tripChecklist.constants";

const now = Date.now();

type Todo = PickRequired<TripChecklist, 'endedAt'>

export function useTripChecklist(tripId: string) {
  const client = useQueryClient();

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripChecklist.key(tripId),
    queryFn: async () => {
      const data = await getChecklist(tripId)
      return data.toSorted((_, item) => item.isCompleted ? -1 : 1)
    },
  });

  const deadlines = useMemo(() => {
    const checklistWithDeadline = data.filter((x): x is Todo => x.endedAt != null);

    return checklistWithDeadline
      .filter(x => !x.isCompleted && differenceInDays(x.endedAt, now) < WARNING_DAYS_FROM_DEADLINE)
      .toSorted((a, b) => getTime(a.endedAt) - getTime(b.endedAt!));
  }, [data]);

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