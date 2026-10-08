import { MaterialIcons } from '@expo/vector-icons'
import { Suspense } from 'react'
import { Badge, IconButton } from '~shared/components/design-system'
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
    <IconButton onPress={() => open(tripId)}>
      <Badge badgeContent={unreadCount} color="error" max={99}>
        <MaterialIcons name="send" size={20} />
      </Badge>
    </IconButton>
  )
}
