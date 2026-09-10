import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { usePreservedCallback } from "@waylog/react";
import type { TripMember } from "../trip-member";
import { useTripMembers } from "../trip-member";
import {
  getChatMessages,
  sendChatMessage,
  subscribeTripMessages,
  tripChatKey,
} from "./tripChat.api";
import type { ChatMessage } from "./tripChat.types";
import { useAuth } from "../../gateways";
import { formatDate, formatISO } from "date-fns";

interface Options {
  onLoad?: (data: ChatMessage[]) => void;
  realtime?: boolean;
}

// 같은 방을 여러 곳(채팅 패널·안읽음 배지)에서 함께 보므로 채널은 방마다 하나만 연다.
// 하나로만 두면 먼저 연 방이 다른 방의 구독까지 막는다.
const subscribedTripIds: Record<string, true> = {};

export function useTripChatMessages(
  tripId: string,
  { onLoad, realtime = true }: Options = {},
) {
  const queryClient = useQueryClient();
  const { data: members } = useTripMembers(tripId, {
    select: (members) => {
      return members.reduce<Record<string, TripMember>>(
        (result, member) => ({
          ...result,
          [member.userId]: member,
        }),
        {},
      );
    },
  });

  const query = useSuspenseQuery({
    queryKey: useTripChatMessages.key(tripId),
    queryFn: () => getChatMessages(tripId),
    staleTime: 0,
    select: (messages) =>
      messages.map((message) => ({
        ...message,
        profile: members?.[message.userId],
      })),
  });

  const appendMessage = (message: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      useTripChatMessages.key(tripId),
      (prev) => (prev == null ? [message] : [...prev, message]),
    );
  };

  const { data: auth } = useAuth();
  useEffect(() => {
    if (!realtime || subscribedTripIds[tripId]) return;
    // 내가 보낸 것까지 이 이벤트로 돌아온다. 목록 갱신은 이 경로 하나로만 한다.
    // 초기 조회 응답과 이벤트가 엇갈리면 같은 것이 이미 들어와 있어 id 로 걸러낸다.
    // profile 은 채우지 않는다 — select 가 조회 시점의 members 로 채운다.
    const unsubscribe = subscribeTripMessages(tripId, (message) => {
      if (message.userId === auth.id) return;

      appendMessage(message);
    });
    subscribedTripIds[tripId] = true;

    return () => {
      unsubscribe();
      delete subscribedTripIds[tripId];
    };
  }, [realtime, tripId, queryClient]);

  // 보낸 메시지는 구독으로 돌아와 목록에 붙는다. 여기서 따로 넣지 않는다 —
  // 두 경로가 함께 쌓으면 같은 메시지가 두 번 보인다.
  const send = useMutation({
    onMutate: (content) => {
      const optimisticId = crypto.randomUUID();

      appendMessage({
        id: optimisticId,
        tripId,
        userId: auth.id,
        userName: auth.name!,
        profile: auth.profile,
        content,
        createdAt: formatISO(Date.now()),
      });

      return { optimisticId };
    },
    mutationFn: (content: string) => {
      return sendChatMessage(tripId, content);
    },
    onSuccess: (created, _, context) => {
      queryClient.setQueryData<ChatMessage[]>(
        useTripChatMessages.key(tripId),
        (messages) =>
          messages?.map((message) => {
            if (message.id === context.optimisticId) {
              return created;
            }
            return message;
          }),
      );
    },
    onError: (_, __, context) => {
      queryClient.setQueryData<ChatMessage[]>(
        useTripChatMessages.key(tripId),
        (messages) => messages?.filter((x) => x.id !== context?.optimisticId),
      );
    },
  });

  const handleLoad = usePreservedCallback(() => onLoad?.(query.data));
  useEffect(() => handleLoad(), [query.data]);

  return {
    ...query,
    send: Object.assign(send.mutateAsync, send),
  };
}
useTripChatMessages.key = (tripId: string) => [tripChatKey, "list", tripId];
