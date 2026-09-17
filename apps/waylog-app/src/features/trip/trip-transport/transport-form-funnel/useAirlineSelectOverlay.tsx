import type { Airline } from '@waylog/domains/modules/airline'
import { useCallback } from 'react'
import { FullScreenPopup } from '../../../../shared/components/FullScreenPopup'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { AirlineSearchPanel } from './AirlineSearchPanel'

export function useAirlineSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<Airline | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
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
      ))
    })
  }, [overlay])

  return { open }
}
