import { useAuth } from '@waylog/domains/clients'
import { useTrip } from '@waylog/domains/modules/trip'
import { Button } from '~/shared/components/design-system'
import type { ButtonProps } from '~/shared/components/design-system/Button'
import { useAppNavigation } from '../../../shared/hooks/useAppNavigation'
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
  const navigation = useAppNavigation()

  const handleLeaveTrip = async () => {
    if (!(await confirm('여행을 나가시겠어요?'))) return

    navigation.reset({ index: 0, routes: [{ name: 'Home' }] })
    if (auth.id === userId) {
      await removeTrip()
      return
    }
    await leaveTrip()
  }

  return (
    <Button {...props} color="error" onPress={handleLeaveTrip}>
      {children}
    </Button>
  )
}
