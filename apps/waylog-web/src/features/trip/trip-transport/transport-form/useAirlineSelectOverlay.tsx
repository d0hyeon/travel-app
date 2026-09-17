import { Dialog, DialogContent } from '@mui/material'
import type { Airline } from '@waylog/domains/modules/airline'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { AirlineSearchPanel } from './AirlineSearchPanel'

export function useAirlineSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<Airline | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <AirlineSelectOverlay
          isOpen={isOpen}
          onClose={() => {
            close()
            resolve(null)
          }}
          onSelect={(airline) => {
            close()
            resolve(airline)
          }}
        />
      ))
    })
  }, [overlay])

  return { open }
}

interface OverlayProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (airline: Airline) => void
}

function AirlineSelectOverlay({ isOpen, onClose, onSelect }: OverlayProps) {
  const isMobile = useIsMobile()
  const panel = <AirlineSearchPanel onSelect={onSelect} onClose={onClose} />

  if (isMobile) {
    return (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        {panel}
      </FullScreenPopup>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ p: 0, height: 520 }}>{panel}</DialogContent>
    </Dialog>
  )
}
