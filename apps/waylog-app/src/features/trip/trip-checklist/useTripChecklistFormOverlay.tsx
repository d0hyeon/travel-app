import { StyleSheet } from 'react-native'
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist'
import { useCallback, useRef } from 'react'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '~/shared/components/design-system'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { TripChecklistForm, type TripChecklistFormRef, type TripChecklistFormValue } from './TripChecklistForm'
import { KeyboardDismissArea } from '../../../shared/components/KeyboardDismissArea'

export function useTripChecklistFormOverlay(tripId: string) {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<void>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <TripChecklistFormSheet
          tripId={tripId}
          isOpen={isOpen}
          onClose={() => {
            resolve()
            close()
          }}
        />
      ))
    })
  }, [overlay, tripId])

  return { open }
}

interface SheetProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
}

function TripChecklistFormSheet({ tripId, isOpen, onClose }: SheetProps) {
  const { add } = useTripChecklist(tripId)
  const formRef = useRef<TripChecklistFormRef>(null)

  const handleSubmit = async (value: TripChecklistFormValue) => {
    await add(value)
    onClose()
  }

  return (
    <KeyboardDismissArea>
      <BottomSheet isOpen={isOpen} onDismiss={onClose} safeArea snapPoints={[0.75]} defaultSnapIndex={0}>
        <BottomSheet.Header>체크리스트</BottomSheet.Header>
        <BottomSheet.Body style={styles.sheetBody}>
          <TripChecklistForm ref={formRef} tripId={tripId} onSubmit={handleSubmit} />
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
    </KeyboardDismissArea>
  )
}

const styles = StyleSheet.create({
  sheetBody: { paddingHorizontal: 16 },
})
