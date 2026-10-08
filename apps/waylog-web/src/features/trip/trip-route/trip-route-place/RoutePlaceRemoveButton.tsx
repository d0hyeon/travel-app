import { Button, type ButtonProps } from '@mui/material'
import { useTripRoutes } from '@waylog/domains/modules/trip'
import { toast } from 'sonner'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'

interface Props extends Omit<ButtonProps, 'onClick' | 'children'> {
  tripId: string
  routeId: string
  placeId: string
  onRemoved: () => void
}

export function RoutePlaceRemoveButton({ tripId, routeId, placeId, onRemoved, ...props }: Props) {
  const confirm = useConfirmDialog()
  const { data: { routes }, update } = useTripRoutes(tripId)

  const removeFromRoute = async () => {
    const route = routes.find((x) => x.id === routeId)
    if (route == null) return
    if (!(await confirm('이 장소를 일정에서 뺄까요?'))) return

    onRemoved()
    await update({ routeId, placeIds: route.placeIds.filter((id) => id !== placeId) })
    toast.success('일정에서 뺐어요')
  }

  return (
    <Button type="button" variant="outlined" color="inherit" size="small" {...props} onClick={removeFromRoute}>
      일정에서 빼기
    </Button>
  )
}
