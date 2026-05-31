import { useMutation } from '@tanstack/react-query'
import { sendChatMessage } from './tripChat.api'

export function useSendChatMessage(tripId: string) {
  const { mutate: send, isPending } = useMutation({
    mutationFn: (content: string) => sendChatMessage(tripId, content),
  })

  return { send, isPending }
}
