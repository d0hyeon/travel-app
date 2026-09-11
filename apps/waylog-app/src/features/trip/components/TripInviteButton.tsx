import { useTrip } from '@waylog/domains/modules/trip'
import { Share } from 'react-native'
import { Button } from '~/shared/components/design-system'
import type { ButtonProps } from '~/shared/components/design-system/Button'

interface Props extends ButtonProps {
  tripId: string
}

// 웹은 navigator.share / clipboard 를 쓰지만 RN 은 네이티브 공유 시트를 쓴다.
export function TripInviteButton({ tripId, children = '초대하기', ...props }: Props) {
  const { data: trip } = useTrip(tripId)

  const handleShare = async () => {
    const inviteUrl = `${process.env.EXPO_PUBLIC_WEB_BASE_URL}/trip/invite/${trip.shareLink}`

    await Share.share({ message: inviteUrl })
  }

  return (
    <Button {...props} onPress={handleShare}>
      {children}
    </Button>
  )
}
