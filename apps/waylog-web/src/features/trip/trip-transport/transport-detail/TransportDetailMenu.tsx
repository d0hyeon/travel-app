import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useTripTransport } from '@waylog/domains/modules/trip-transport'
import { useNavigate } from 'react-router'
import { PopMenu } from '~shared/components/PopMenu'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'

interface Props {
  tripId: string
  transportId: string
}

export function TransportDetailMenu({ tripId, transportId }: Props) {
  const navigate = useNavigate()
  const confirm = useConfirmDialog()
  const { remove } = useTripTransport(tripId)

  const removeTransport = async () => {
    const isConfirmed = await confirm('이 교통편을 삭제하시겠어요?')
    if (!isConfirmed) return

    await remove(transportId)
    navigate(`/trip/${tripId}?content=Info&info-tab=transport`, { replace: true })
  }

  return (
    <PopMenu
      items={
        <PopMenu.Item color="error" icon={<DeleteOutlineIcon fontSize="small" />} onClick={removeTransport}>
          삭제
        </PopMenu.Item>
      }
    />
  )
}
