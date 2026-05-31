import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sendChatMessage, tripChatKey } from './tripChat.api'

export function useSendChatMessage(tripId: string) {
  const queryClient = useQueryClient()

  const { mutate: send, isPending } = useMutation({
    mutationFn: (content: string) => sendChatMessage(tripId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tripChatKey, 'list', tripId] })
    },
  })

  return { send, isPending }
}
