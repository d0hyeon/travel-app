import { useCallback } from 'react'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { PlaceDetailSheet } from './PlaceDetailSheet'

// 웹 usePlaceDetailOverlay 와 같은 시그니처를 유지한다.
// 앱은 화면 분기가 없으므로 시트 하나만 띄운다.
export function usePlaceDetailOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (placeId: string) => {
      overlay.open(({ isOpen, close }) => (
        <PlaceDetailSheet placeId={placeId} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}
