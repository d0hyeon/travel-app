import { Dialog, DialogContent, Stack, Typography } from '@mui/material'
import { searchAirports, type Airport } from '@waylog/domains/modules/airport'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { SearchSelectPanel } from './SearchSelectPanel'

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
  const panel = (
    <SearchSelectPanel
      title={title}
      placeholder="예: 인천공항, ICN, 오사카"
      search={searchAirports}
      getKey={(airport) => airport.code}
      renderItem={(airport) => (
        <Stack>
          <Typography variant="body2" fontWeight={700}>
            {airport.nameKo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {airport.code} · {airport.cityKo}
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
