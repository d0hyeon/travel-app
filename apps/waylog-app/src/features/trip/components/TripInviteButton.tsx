import { useTrip } from '@waylog/domains/trip'
import { Share } from 'react-native'
import { Button } from '../../../shared/components/mui'

interface Props {
  tripId: string
  children?: string
  size?: 'small' | 'medium' | 'large'
}

// 웹은 navigator.share / clipboard 를 쓰지만 RN 은 네이티브 공유 시트를 쓴다.
export function TripInviteButton({ tripId, children = '초대하기', size = 'small' }: Props) {
  const { data: trip } = useTrip(tripId)

  const handleShare = async () => {
    await Share.share({ message: `https://waylog.app/trip/invite/${trip.shareLink}` })
  }

  return (
    <Button size={size} onClick={handleShare}>
      {children}
    </Button>
  )
}
