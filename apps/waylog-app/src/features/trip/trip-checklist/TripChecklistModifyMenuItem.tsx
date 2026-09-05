import { useRef } from 'react'
import { useTripChecklist, type TripChecklist } from '@waylog/domains/modules/trip-checklist'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PopMenu } from '../../../shared/components/PopMenu'
import { TripChecklistForm, type TripChecklistFormRef } from './TripChecklistForm'

interface Props {
  tripId: string
  item: TripChecklist
}

/** 체크리스트 항목 수정 메뉴 항목. 클릭 시 수정 시트를 연다. */
export function TripChecklistModifyMenuItem({ tripId, item }: Props) {
  const { update } = useTripChecklist(tripId)
  const overlay = useOverlay()

  const openEditor = () => {
    overlay.open(({ isOpen, close }) => (
      <TripChecklistModifySheet
        isOpen={isOpen}
        onClose={close}
        tripId={tripId}
        item={item}
        onSubmit={async (value) => {
          await update({ id: item.id, ...value })
          close()
        }}
      />
    ))
  }

  return (
    <PopMenu.Item onClick={openEditor}>
      수정
    </PopMenu.Item>
  )
}

interface SheetProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  item: TripChecklist
  onSubmit: (value: Omit<TripChecklist, 'id' | 'tripId' | 'createdAt' | 'isCompleted'>) => Promise<void>
}

function TripChecklistModifySheet({ isOpen, onClose, tripId, item, onSubmit }: SheetProps) {
  const formRef = useRef<TripChecklistFormRef>(null)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.6]} defaultSnapIndex={0}>
      <BottomSheet.Header>할 일 수정</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <TripChecklistForm
          ref={formRef}
          tripId={tripId}
          defaultValues={{
            title: item.title,
            content: item.content,
            startedAt: item.startedAt,
            endedAt: item.endedAt,
            memberId: item.memberId,
          }}
          onSubmit={onSubmit}
        />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onClose}>취소</Button>
        <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>저장</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
