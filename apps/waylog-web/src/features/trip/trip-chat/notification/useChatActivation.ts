import { useEffect } from 'react';
import { ChattingNotificationType, type ChattingNotificationMessage } from './chatting-notification.types';



function postToSW(message: ChattingNotificationMessage) {
  navigator.serviceWorker.controller?.postMessage(message)
}

let activeTripId: string | null = null;

export function getActivedChatTripId() {
  return activeTripId;
}

export function useChatActivation(tripId: string) {
  useEffect(() => {
    postToSW({ type: ChattingNotificationType.open, tripId });
    activeTripId = tripId;
    
    return () => {
      postToSW({ type: ChattingNotificationType.close, tripId })
      activeTripId = null;
    }
  }, [tripId])
}
