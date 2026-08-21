import { MaterialIcons } from '@expo/vector-icons'
import { useUnreadChatCount } from '@waylog/domains/trip-chat'
import { Suspense } from 'react'
import { Badge, IconButton } from '../../../shared/components/mui'
import { useTripChatOverlay } from './useTripChatOverlay'

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
  const unreadCount = useUnreadChatCount(tripId)
  return <ChatIconButtonBase tripId={tripId} unreadCount={unreadCount} />
}

function ChatIconButtonBase({ tripId, unreadCount }: Props & { unreadCount: number }) {
  const { open } = useTripChatOverlay()

  return (
    <IconButton onClick={() => open(tripId)}>
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <MaterialIcons name="send" size={20} />
      </Badge>
    </IconButton>
  )
}
