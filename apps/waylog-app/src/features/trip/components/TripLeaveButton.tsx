import { useAuth } from '@waylog/domains/auth'
import { useTrip } from '@waylog/domains/trip'
import { useRouter } from 'expo-router'
import { Button } from '../../../shared/components/mui'
import type { ButtonProps } from '../../../shared/components/mui/Button'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog'

interface Props extends ButtonProps {
  tripId: string
}

export function TripLeaveButton({ tripId, children = '여행에서 나가기', ...props }: Props) {
  const { data: auth } = useAuth()
  const {
    data: { userId },
    remove: removeTrip,
    leave: leaveTrip,
  } = useTrip(tripId)
  const confirm = useConfirmDialog()
  const router = useRouter()

  const handleLeaveTrip = async () => {
    if (!(await confirm('여행을 나가시겠어요?'))) return

    router.replace('/')
    if (auth.id === userId) {
      await removeTrip()
      return
    }
    await leaveTrip()
  }

  return (
    <Button {...props} color="error" onClick={handleLeaveTrip}>
      {children}
    </Button>
  )
}
