import ChatIcon from '@mui/icons-material/Telegram'
import { Badge, IconButton } from '@mui/material'
import { Suspense } from 'react'
import { useTripChatOverlay } from './useTripChatOverlay'
import { useTripUnreadMessageCount } from '@waylog/domains/modules/trip-chat'

interface Props {
  tripId: string
}

export function ChatIconButton({ tripId }: Props) {
  return (
    <Suspense fallback={<ChatIconButtonBase tripId={tripId} unreadCount={0} />}>
      <ChatIconButtonResolved tripId={tripId} />
    </Suspense>
  )
}

function ChatIconButtonResolved({ tripId }: Props) {
  const unreadCount = useTripUnreadMessageCount(tripId)
  return <ChatIconButtonBase tripId={tripId} unreadCount={unreadCount} />
}

function ChatIconButtonBase({ tripId, unreadCount }: Props & { unreadCount: number }) {
  const { open } = useTripChatOverlay()

  return (
    <IconButton onClick={() => open(tripId)} color="inherit" aria-label="채팅 열기">
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <ChatIcon fontSize="small" />
      </Badge>
    </IconButton>
  )
}
