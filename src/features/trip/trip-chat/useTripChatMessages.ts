import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import type { TripMember } from '../trip-member/tripMember.types';
import { useTripMembers } from '../trip-member/useTripMembers';
import { getChatMessages, sendChatMessage, subscribeTripMessages, tripChatKey } from './tripChat.api';
import type { ChatMessage } from './tripChat.types';


interface TripChat extends ChatMessage {
  user?: TripMember;
}

interface Options {
  onLoad?: (data: TripChat[]) => void;
  realtime?: boolean;
}

let isSubscribed = false;

export function useTripChatMessages(tripId: string, { onLoad, realtime = true }: Options = {}) {
  const queryClient = useQueryClient();
  const { data: members } = useTripMembers(tripId, {
    select: (members) => {
      return members.reduce<Record<string, TripMember>>((result, member) => ({
        ...result,
        [member.userId]: member
      }), {})
    }
  });

  const query = useSuspenseQuery({
    queryKey: useTripChatMessages.key(tripId),
    queryFn: () => getChatMessages(tripId),
    staleTime: 0,
    select: (messages) => messages.map(message => ({
      ...message,
      user: members?.[message.userId]
    }))
  });

  useEffect(() => {
    if (!realtime || isSubscribed) return;
    const unsubscribe = subscribeTripMessages(tripId, (data) => {
      const message = { ...data, user: members?.[data.userId] }
      queryClient.setQueryData<ChatMessage[]>(
        useTripChatMessages.key(tripId),
        (prev) => {
          if (prev == null) return [message];
          return [...prev, message]
        }
      )
    })
    isSubscribed = true;

    return () => {
      unsubscribe();
      isSubscribed = false;
    }
  }, [realtime])

  const send = useMutation({
    mutationFn: (content: string) => sendChatMessage(tripId, content),
  });

  const handleLoad = useEffectEvent(() => onLoad?.(query.data));
  useEffect(() => handleLoad(), [query.data]);

  return {
    ...query,
    send: Object.assign(send.mutateAsync, send)
  }

}
useTripChatMessages.key = (tripId: string) => [tripChatKey, 'list', tripId]


