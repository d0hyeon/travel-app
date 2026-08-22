import { useTripChecklist } from '@waylog/domains/modules/trip-checklist'
import { useRef } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { TripChecklistForm, type TripChecklistFormRef } from './TripChecklistForm'

interface Props {
  tripId: string
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function TripChecklistAddButton({ tripId, size = 'large', fullWidth }: Props) {
  const { add } = useTripChecklist(tripId)
  const overlay = useOverlay()

  const open = () => {
    overlay.open(({ isOpen, close }) => {
      const formRef = { current: null as TripChecklistFormRef | null }

      return (
        <BottomSheet isOpen={isOpen} onClose={close} safeArea snapPoints={[0.75]} defaultSnapIndex={0}>
          <BottomSheet.Header>체크리스트</BottomSheet.Header>
          <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
            <TripChecklistForm
              ref={(instance) => {
                formRef.current = instance
              }}
              tripId={tripId}
              onSubmit={async (value) => {
                await add(value)
                close()
              }}
            />
          </BottomSheet.Body>
          <BottomSheet.BottomActions>
            <Button variant="outlined" fullWidth onClick={close}>
              취소
            </Button>
            <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>
              저장
            </Button>
          </BottomSheet.BottomActions>
        </BottomSheet>
      )
    })
  }

  return (
    <Button variant="contained" size={size} fullWidth={fullWidth} onClick={open}>
      할 일 추가
    </Button>
  )
}
