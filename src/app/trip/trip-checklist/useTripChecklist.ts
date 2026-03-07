import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { differenceInDays, getTime } from "date-fns";
import { useMemo } from "react";
import type { PickRequired } from "~shared/utils/types";
import { createChecklist, getChecklist, path, removeChecklist, updateChecklist, type CreateChecklist, type UpdateChecklist } from "./tripChecklist.api";
import type { TripChecklist } from "./tripChecklist.type";
import { WARNING_DAYS_FROM_DEADLINE } from "./tripChecklist.constants";

const now = Date.now();

type Todo = PickRequired<TripChecklist, 'endedAt'>

export function useTripChecklist(tripId: string) {
  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripChecklist.key(tripId),
    queryFn: () => getChecklist(tripId),
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
    mutationFn: (params: Omit<UpdateChecklist, 'tripId'>) => {
      return updateChecklist(params)
    },
    onSuccess: () => refetch(),
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