import { MaterialIcons } from '@expo/vector-icons'
import { useCallback } from 'react'
import { FullScreenPopup } from '../../../shared/components/FullScreenPopup'
import { IconButton } from '../../../shared/components/mui'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { TripChatPanel } from './TripChatPanel'

// 웹 useTripChatOverlay 와 같은 시그니처를 유지한다.
// 웹은 모바일에서 FullScreenPopup, 데스크톱에서 Paper 를 썼다.
// 앱은 모바일 경로만 있다.
export function useTripChatOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (tripId: string) => {
      overlay.open(({ isOpen, close }) => (
        <FullScreenPopup isOpen={isOpen} onClose={close}>
          <TripChatPanel
            tripId={tripId}
            header={
              <TripChatPanel.Header
                rightElement={
                  <IconButton onClick={close}>
                    <MaterialIcons name="close" size={20} />
                  </IconButton>
                }
              />
            }
          />
        </FullScreenPopup>
      ))
    },
    [overlay],
  )

  return { open }
}
