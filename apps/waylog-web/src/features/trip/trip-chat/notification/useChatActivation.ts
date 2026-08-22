import { useChatActivation as useSharedChatActivation } from '@waylog/domains/modules/trip-chat';
import { ChattingNotificationType, type ChattingNotificationMessage } from './chatting-notification.types';

export { getActivedChatTripId } from '@waylog/domains/modules/trip-chat';

function postToSW(message: ChattingNotificationMessage) {
  navigator.serviceWorker.controller?.postMessage(message)
}

export function useChatActivation(tripId: string) {
  // 활성 방 추적은 공유하고, service worker 통지만 웹에 남긴다.
  useSharedChatActivation(tripId, {
    onChange: ({ tripId, isOpen }) => {
      postToSW({
        type: isOpen ? ChattingNotificationType.open : ChattingNotificationType.close,
        tripId,
      })
    },
  })
}
