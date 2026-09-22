import type { Airport } from '@waylog/domains/modules/airport'
import { useCallback } from 'react'
import { FullScreenPopup } from '../../../shared/components/FullScreenPopup'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { AirportSearchPanel } from './AirportSearchPanel'
import { KeyboardDismissArea } from '../../../shared/components/KeyboardDismissArea'

export function useAirportSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (title: string) => {
      return new Promise<Airport | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <KeyboardDismissArea>
            <FullScreenPopup isOpen={isOpen} onClose={close}>
              <AirportSearchPanel
                title={title}
                onSelect={(airport) => {
                  close()
                  resolve(airport)
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
    },
    [overlay],
  )

  return { open }
}
