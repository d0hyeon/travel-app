import { Dialog, DialogContent } from '@mui/material'
import type { Airport } from '@waylog/domains/modules/airport'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { AirportSearchPanel } from './AirportSearchPanel'

export function useAirportSelectOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (title: string) => {
      return new Promise<Airport | null>((resolve) => {
        overlay.open(({ isOpen, close }) => (
          <AirportSelectOverlay
            title={title}
            isOpen={isOpen}
            onClose={() => {
              close()
              resolve(null)
            }}
            onSelect={(airport) => {
              close()
              resolve(airport)
            }}
          />
        ))
      })
    },
    [overlay],
  )

  return { open }
}

interface OverlayProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSelect: (airport: Airport) => void
}

function AirportSelectOverlay({ title, isOpen, onClose, onSelect }: OverlayProps) {
  const isMobile = useIsMobile()
  const panel = <AirportSearchPanel title={title} onSelect={onSelect} onClose={onClose} />

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
