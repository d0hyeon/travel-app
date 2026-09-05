import { useRef } from 'react'
import { assert } from '@waylog/utility'
import { useTripChecklist } from '@waylog/domains/modules/trip-checklist'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PopMenu } from '../../../shared/components/PopMenu'
import { TripChecklistForm, type TripChecklistFormRef, type TripChecklistFormValue } from './TripChecklistForm'

interface Props {
  tripId: string
  id: string
}

/** 체크리스트 항목 수정 메뉴 항목. 클릭 시 수정 시트를 연다. */
export function TripChecklistModifyMenuItem({ tripId, id }: Props) {
  const overlay = useOverlay()

  const openEditor = () => {
    overlay.open(({ isOpen, close }) => (
      <TripChecklistModifySheet isOpen={isOpen} onClose={close} tripId={tripId} id={id} />
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
  id: string
}

function TripChecklistModifySheet({ isOpen, onClose, tripId, id }: SheetProps) {
  const { data: { checklist }, update } = useTripChecklist(tripId)
  const target = checklist.find(x => x.id === id)
  assert(target != null, '존재하지 않는 항목입니다.')
  const formRef = useRef<TripChecklistFormRef>(null)

  const handleSubmit = async (value: TripChecklistFormValue) => {
    await update({ id, ...value })
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} safeArea snapPoints={[0.75]} defaultSnapIndex={0}>
      <BottomSheet.Header>할 일 수정</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <TripChecklistForm
          ref={formRef}
          tripId={tripId}
          defaultValues={{
            title: target.title,
            content: target.content,
            startedAt: target.startedAt,
            endedAt: target.endedAt,
            memberId: target.memberId,
          }}
          onSubmit={handleSubmit}
        />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onClose}>취소</Button>
        <Button variant="contained" fullWidth onClick={() => formRef.current?.submit()}>저장</Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
