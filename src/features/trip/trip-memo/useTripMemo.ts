import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  createMemo,
  getMemos,
  path,
  removeMemo,
  updateMemo,
  type CreateMemo,
  type UpdateMemo,
} from "./tripMemo.api";
import type { TripMemo } from "./tripMemo.type";

export function useTripMemo(tripId: string) {
  const client = useQueryClient();

  const { data, refetch, ...queries } = useSuspenseQuery({
    queryKey: useTripMemo.key(tripId),
    queryFn: () => getMemos(tripId),
  });

  const pinnedMemos = useMemo(
    () => data.filter((memo) => memo.isPinned),
    [data]
  );

  const { mutateAsync: add } = useMutation({
    mutationFn: (params: Omit<CreateMemo, 'tripId'>) => {
      return createMemo({ tripId, ...params });
    },
    onSuccess: () => refetch(),
  });

  const { mutateAsync: update } = useMutation({
    mutationFn: (params: UpdateMemo) => updateMemo(params),
    onMutate: async (params) => {
      await client.cancelQueries({ queryKey: useTripMemo.key(tripId) });

      const previous = client.getQueryData<TripMemo[]>(useTripMemo.key(tripId));

      client.setQueryData<TripMemo[]>(useTripMemo.key(tripId), (curr) => {
        if (!curr) return curr;
        return curr.map((memo) =>
          memo.id === params.id ? { ...memo, ...params } : memo
        );
      });

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        client.setQueryData(useTripMemo.key(tripId), context.previous);
      }
    },
  });

  const { mutateAsync: remove } = useMutation({
    mutationFn: (id: string) => removeMemo(id),
    onSuccess: () => refetch(),
  });

  const togglePin = (id: string) => {
    const memo = data.find((m) => m.id === id);
    if (memo) {
      update({ id, isPinned: !memo.isPinned });
    }
  };

  return {
    data: { memos: data, pinnedMemos },
    refetch,
    add,
    update,
    remove,
    togglePin,
    ...queries,
  };
}

useTripMemo.key = (tripId: string) => [path, tripId];
