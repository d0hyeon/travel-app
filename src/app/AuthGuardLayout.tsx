import { useSnackbar } from 'notistack'
import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { AuthNavigate } from '~features/auth/AuthNavigate'
import { useAuth } from '~features/auth/useAuth'
import { getActivedChatTripId } from '~features/trip/trip-chat/notification/useChatActivation'
import { useChatWebPushFallback as useChatBrowserPushFallback } from '~features/trip/trip-chat/notification/useChatWebPushFallback'
import { Toaster, toast } from 'sonner'
import { useTripChatOverlay } from '~features/trip/trip-chat/useTripChatOverlay'
import { Button } from '@mui/material'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

export default function AuthGuardLayout() {
  const { data: user } = useAuth()

  if (!user) {
    return <AuthNavigate />
  }

  return (
    <>
      <Suspense>
        <ChatInWebPush />
      </Suspense>
      <Outlet />
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
