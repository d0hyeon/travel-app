import { useAuth } from '@waylog/domains/clients'
import { useTrip } from '@waylog/domains/modules/trip'
import {
  findHostSuccessor,
  getTripRole,
  TripPermission,
  useTripMembers,
  useTripPermission,
} from '@waylog/domains/modules/trip-member'
import { assert } from '@waylog/utility'
import { toast } from 'sonner-native'
import { Button } from '~shared/components/design-system'
import type { ButtonProps } from '~shared/components/design-system/Button'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { AppRoute } from '~app/AppRoute'

interface Props extends ButtonProps {
  tripId: string
}

export function TripLeaveButton({ tripId, children = '여행에서 나가기', ...props }: Props) {
  const { leave: leaveTrip } = useTrip(tripId)
  const isLeavable = useTripPermission(tripId, TripPermission.탈퇴)

  assert(isLeavable, '권한이 없습니다.')

  const confirm = useConfirmDialog()
  const navigation = useAppNavigation()

  const handleLeaveTrip = async () => {
    if (!(await confirm("여행을 나가시겠어요?"))) return

    navigation.reset({ index: 0, routes: [{ name: AppRoute.메인 }] })
    try {
      await leaveTrip()
    } catch {
      toast.error('여행에서 나가지 못했어요. 잠시 후 다시 시도해 주세요.')
    }
  }

  return (
    <Button {...props} color="error" onPress={handleLeaveTrip}>
      {children}
    </Button>
  )
}
