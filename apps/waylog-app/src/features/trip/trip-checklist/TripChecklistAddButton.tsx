import { useTripChecklist } from '@waylog/domains/modules/trip-checklist'
import { useRef } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '~/shared/components/design-system'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { TripChecklistForm, type TripChecklistFormRef, type TripChecklistFormValue } from './TripChecklistForm'

interface Props {
  tripId: string
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
}

export function TripChecklistAddButton({ tripId, size = 'large', fullWidth }: Props) {
  const { add } = useTripChecklist(tripId)
  const overlay = useOverlay()

  const open = () => {
    overlay.open(({ isOpen, close }) => (
      <TripChecklistFormSheet
        isOpen={isOpen}
        onClose={close}
        tripId={tripId}
        onSubmit={async (value) => {
          await add(value)
          close()
        }}
      />
    ))
  }

  return (
    <Button variant="contained" size={size} fullWidth={fullWidth} onPress={open}>
      할 일 추가
    </Button>
  )
}

interface TripChecklistFormSheetProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onSubmit: (value: TripChecklistFormValue) => Promise<void>
}

function TripChecklistFormSheet({ isOpen, onClose, tripId, onSubmit }: TripChecklistFormSheetProps) {
  const formRef = useRef<TripChecklistFormRef>(null)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} safeArea snapPoints={[0.75]} defaultSnapIndex={0}>
      <BottomSheet.Header>체크리스트</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <TripChecklistForm ref={formRef} tripId={tripId} onSubmit={onSubmit} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onPress={onClose}>
          취소
        </Button>
        <Button variant="contained" fullWidth onPress={() => formRef.current?.submit()}>
          저장
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
