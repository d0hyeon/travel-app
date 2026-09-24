import { MaterialIcons } from '@expo/vector-icons'
import { useTripTransports } from '@waylog/domains/modules/trip-transport'
import { useRouter } from 'expo-router'
import { PopMenu } from '../../../../shared/components/PopMenu'
import { useConfirmDialog } from '../../../../shared/components/confirm-dialog/useConfirmDialog'

interface Props {
  tripId: string
  transportId: string
}

export function TransportDetailMenu({ tripId, transportId }: Props) {
  const router = useRouter()
  const { remove } = useTripTransports(tripId)
  const confirm = useConfirmDialog()

  // 지운 교통편의 상세에 남아 있으면 조회가 곧바로 실패한다. 목록으로 되돌린다.
  const removeTransport = async () => {
    if (!(await confirm('교통편을 삭제하시겠어요?'))) return

    remove(transportId)
    router.back()
  }

  return (
    <PopMenu
      items={
        <PopMenu.Item
          color="error"
          icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />}
          onPress={removeTransport}
        >
          삭제
        </PopMenu.Item>
      }
    />
  )
}
