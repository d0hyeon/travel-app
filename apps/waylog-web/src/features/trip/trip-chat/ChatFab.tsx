import ChatIcon from '@mui/icons-material/Send'
import { Badge, Fab } from '@mui/material'
import { Suspense } from 'react'
import { useTripChatOverlay } from './useTripChatOverlay'
import { useTripUnreadMessageCount } from '@waylog/domains/modules/trip-chat'

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
  const unreadCount = useTripUnreadMessageCount(tripId)
  return <ChatFabBase tripId={tripId} unreadCount={unreadCount} />
}

function ChatFabBase({ tripId, unreadCount }: Props & { unreadCount: number }) {
  const { open } = useTripChatOverlay()

  return (
    <Fab
      color="primary"
      onClick={() => open(tripId)}
      aria-label="채팅 열기"
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
