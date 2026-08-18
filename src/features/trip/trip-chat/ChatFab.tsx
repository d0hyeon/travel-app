import ChatIcon from '@mui/icons-material/Send'
import { Badge, Fab } from '@mui/material'
import { Suspense } from 'react'
import { useUnreadChatCount } from './useUnreadChatCount'
import { useTripChatOverlay } from './useTripChatOverlay'

interface Props {
  tripId: string
}

export function ChatFab({ tripId }: Props) {
  return (
    <Suspense fallback={<ChatFabBase tripId={tripId} unreadCount={0} />}>
      <ChatFabResolved tripId={tripId} />
    </Suspense>
  )
}

function ChatFabResolved({ tripId }: Props) {
  const unreadCount = useUnreadChatCount(tripId)
  return <ChatFabBase tripId={tripId} unreadCount={unreadCount} />
}

function ChatFabBase({ tripId, unreadCount }: Props & { unreadCount: number }) {
  const { open } = useTripChatOverlay()

  return (
    <Fab
      color="primary"
      onClick={() => open(tripId)}
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 1200,
      }}
    >
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <ChatIcon />
      </Badge>
    </Fab>
  )
}
