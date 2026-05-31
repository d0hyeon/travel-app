import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useEffectEvent } from 'react';
import type { TripMember } from '../trip-member/tripMember.types';
import { useTripMembers } from '../trip-member/useTripMembers';
import { getChatMessages, sendChatMessage, subscribeTripMessages, tripChatKey } from './tripChat.api';
import type { ChatMessage } from './tripChat.types';

let referencedCount = 0;

export function useSubscribeTripChat(tripId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if(referencedCount > 0) {
      referencedCount++;
      
      return () => {
        referencedCount--;
      }
    }

    const unsubscribe = subscribeTripMessages(tripId, (newMessage) => {
      queryClient.setQueryData<ChatMessage[]>(
        useTripChat.key(tripId),
        (prev) => [...(prev ?? []), newMessage]
      )
    })

    return unsubscribe;
  }, [tripId, queryClient])
}

interface TripChat extends ChatMessage {
  user?: TripMember;
}

interface Options {
  onLoad?: (data: TripChat[]) => void;
}

export function useTripChat(tripId: string, { onLoad }: Options = {}) {
  const query = useSuspenseQuery({
    queryKey: useTripChat.key(tripId),
    queryFn: async () => {
      const [messages, members] = await Promise.all([
        getChatMessages(tripId),
        useTripMembers.fetch(tripId)
      ])
      const member = members.reduce<Record<string, TripMember>>((result, member) => ({
        ...result,
        [member.userId]: member
      }), {})

      return messages.map<TripChat>(message => ({
        ...message,
        user: member[message.userId]
      }))
    },
    staleTime: 0,
  })

  const handleLoad = useEffectEvent(() => onLoad?.(query.data));
  useEffect(() => handleLoad(), [query.data]);

  const send = useMutation({
    mutationFn: (content: string) => sendChatMessage(tripId, content),
  })

  return {
    ...query,
    send: Object.assign(send.mutateAsync, send)
  }

}
useTripChat.key = (tripId: string) => [tripChatKey, 'list', tripId]


