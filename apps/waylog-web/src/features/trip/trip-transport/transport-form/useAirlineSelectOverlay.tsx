import { Dialog, DialogContent, Stack, Typography } from '@mui/material'
import { searchAirlines, type Airline } from '@waylog/domains/modules/airline'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { SearchSelectPanel } from './SearchSelectPanel'

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
  const panel = (
    <SearchSelectPanel
      title="항공사 선택"
      placeholder="예: 대한항공, KE"
      search={searchAirlines}
      getKey={(airline) => airline.code}
      renderItem={(airline) => (
        <Stack>
          <Typography variant="body2" fontWeight={700}>
            {airline.nameKo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {airline.code}
          </Typography>
        </Stack>
      )}
      onSelect={onSelect}
      onClose={onClose}
    />
  )

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
