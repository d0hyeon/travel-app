import CloseIcon from '@mui/icons-material/Close'
import { Fade, IconButton, Paper, type IconButtonProps } from '@mui/material'
import { useCallback } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { TripChatPanel } from './trip-chat-pannel/TripChatPanel'

interface OverlayProps {
  tripId: string
  isOpen: boolean
  onClose: () => void
}

export function useTripChatOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (tripId: string) => {
      overlay.open(({ isOpen, close }) => (
        <TripChatOverlay tripId={tripId} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}

function TripChatOverlay({ tripId, isOpen, onClose }: OverlayProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        <TripChatPanel tripId={tripId} header={<TripChatPanel.Header rightElement={<CloseIconButton onClick={onClose} />} />} />
      </FullScreenPopup>
    )
  }


  return (
    <Fade in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 96,
          right: 24,
          width: 360,
          height: 520,
          borderRadius: 3,
          overflow: 'hidden',
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <TripChatPanel
          tripId={tripId}
          header={<TripChatPanel.Header rightElement={<CloseIconButton onClick={onClose} />} />}
        />
      </Paper>
    </Fade>
  )
}

function CloseIconButton(props: IconButtonProps) {
  return (
    <IconButton size="small" {...props}>
      <CloseIcon fontSize="small" />
    </IconButton>
  )
}
