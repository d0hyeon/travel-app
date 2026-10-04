import type { Airline } from '@waylog/domains/modules/airline'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useOverlay } from '~shared/hooks/useOverlay'
import { AirlineSearchPanel } from './AirlineSearchPanel'
import { KeyboardDismissArea } from '~shared/components/KeyboardDismissArea'

export function useAirlineSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<Airline | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <KeyboardDismissArea>
          <FullScreenPopup isOpen={isOpen} onClose={close}>
            <AirlineSearchPanel
              onSelect={(airline) => {
                close()
                resolve(airline)
              }}
              onClose={() => {
                close()
                resolve(null)
              }}
            />
          </FullScreenPopup>
        </KeyboardDismissArea>
      ))
    })
  }, [overlay])

  return { open }
}
