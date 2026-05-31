import { Dialog, Paper, Slide } from '@mui/material'
import { forwardRef, useCallback, type Ref } from 'react'
import type { TransitionProps } from '@mui/material/transitions'
import { useOverlay } from '~shared/hooks/useOverlay'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { TripChatPanel } from './TripChatPanel'

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
      <Dialog
        open={isOpen}
        onClose={onClose}
        fullScreen
        slots={{ transition: SlideUpTransition }}
      >
        <TripChatPanel tripId={tripId} isOpen={isOpen} onClose={onClose} />
      </Dialog>
    )
  }

  if (!isOpen) return null

  return (
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
      <TripChatPanel tripId={tripId} isOpen={isOpen} onClose={onClose} />
    </Paper>
  )
}

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})
