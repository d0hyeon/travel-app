import { Dialog, DialogContent } from '@mui/material'
import type { FlightSearchResult } from '@waylog/domains/modules/transport'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { FlightSearchPanel } from './FlightSearchPanel'

// 항공편 검색은 진행 스텝이 아니라 필드 하나를 채우는 보조 동작이다.
// 퍼널 스택에 두면 진행률에서 매번 예외로 빼야 한다.
export function useFlightSearchOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    return new Promise<FlightSearchResult | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <FlightSearchOverlay
          isOpen={isOpen}
          onClose={() => {
            close()
            resolve(null)
          }}
          onSelect={(flight) => {
            close()
            resolve(flight)
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
  onSelect: (flight: FlightSearchResult) => void
}

function FlightSearchOverlay({ isOpen, onClose, onSelect }: OverlayProps) {
  const isMobile = useIsMobile()
  const panel = <FlightSearchPanel onSelect={onSelect} onClose={onClose} />

  if (isMobile) {
    return (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        {panel}
      </FullScreenPopup>
    )
  }

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: 0 }}>{panel}</DialogContent>
    </Dialog>
  )
}
