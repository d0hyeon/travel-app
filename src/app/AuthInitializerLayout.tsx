import { Button } from '@mui/material'
import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { toast } from 'sonner'
import { AuthNavigate } from '~features/auth/AuthNavigate'
import { useAuth } from '~features/auth/useAuth'
import { getActivedChatTripId } from '~features/trip/trip-chat/notification/useChatActivation'
import { useChatWebPushFallback as useChatBrowserPushFallback } from '~features/trip/trip-chat/notification/useChatWebPushFallback'
import { useTripChatOverlay } from '~features/trip/trip-chat/useTripChatOverlay'

export default function AuthInitializerLayout() {
  const { data: user } = useAuth()

  return (
    <>
      <Outlet />
      <Suspense>
        <ChatInWebPush />
      </Suspense>
    </>
  )
}

function ChatInWebPush() {
  const { open } = useTripChatOverlay();

  useChatBrowserPushFallback(({ tripId, userName, content }) => {
    const isInChat = getActivedChatTripId() === tripId;

    if (isInChat) return;
    toast.message(`${userName} ${content}`, {
      position: 'top-center',
      action: <Button size="small" variant='contained' onClick={() => open(tripId)} sx={{ justifySelf: 'end', alignSelf: 'end' }}>답장</Button>
    })
  })

  return null;
}
