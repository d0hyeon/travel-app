import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { Box, Dialog, IconButton } from '@mui/material'
import { removeTripTransportTicket, useTripTransports } from '@waylog/domains/modules/trip-transport'
import { AsyncBoundary } from '@waylog/react'
import { useCallback, type ReactNode } from 'react'
import { PopMenu } from '~shared/components/PopMenu'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'

interface TicketViewerParams {
  tripId: string
  ticketId: string
}

// 저장된 티켓은 식별자로 열어야 삭제 후 목록을 갱신할 근거가 뷰어 안에 남는다.
export function useTicketViewerOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    ({ tripId, ticketId }: TicketViewerParams) => {
      overlay.open(({ isOpen, close }) => (
        <TicketViewerDialog isOpen={isOpen} onClose={close}>
          <AsyncBoundary resetKeys={[tripId, ticketId]} pendingFallback={<ViewerBar onClose={close} />}>
            <StoredTicketViewer tripId={tripId} ticketId={ticketId} onClose={close} />
          </AsyncBoundary>
        </TicketViewerDialog>
      ))
    },
    [overlay],
  )

  const openDraft = useCallback(
    (image: string, onClose?: () => void) => {
      overlay.open(({ isOpen, close }) => (
        <TicketViewerDialog
          isOpen={isOpen}
          onClose={() => {
            onClose?.()
            close()
          }}
        >
          <ViewerBar onClose={() => {
            onClose?.()
            close()
          }} />
          <TicketImage image={image} />
        </TicketViewerDialog>
      ))
    },
    [overlay],
  )

  return { open, openDraft }
}

interface ViewerDialogProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

function TicketViewerDialog({ isOpen, onClose, children }: ViewerDialogProps) {
  const isMobile = useIsMobile();


  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            bgcolor: 'rgba(0,0,0,0.94)',
            ...(isMobile ? { width: '100vw !important;' } : { width: 480, minHeight: 480, maxHeight: '85vh', borderRadius: 3 }),
          },
        },
      }}
    >
      {children}
    </Dialog>
  )
}

interface StoredTicketViewerProps extends TicketViewerParams {
  onClose: () => void
}

function StoredTicketViewer({ tripId, ticketId, onClose }: StoredTicketViewerProps) {
  const { data: transports, refetch } = useTripTransports(tripId)
  const confirm = useConfirmDialog()
  const ticket = transports.flatMap(({ tickets }) => tickets).find(({ id }) => id === ticketId)

  if (ticket == null) return <ViewerBar onClose={onClose} />

  const deleteTicket = async () => {
    const isConfirmed = await confirm('탑승권을 삭제하시겠어요?')
    if (!isConfirmed) return

    await removeTripTransportTicket(ticketId)
    await refetch()
    onClose()
  }

  return (
    <>
      <ViewerBar onClose={onClose} onDelete={deleteTicket} />
      <TicketImage image={ticket.image} />
    </>
  )
}

function ViewerBar({ onClose, onDelete }: { onClose: () => void; onDelete?: () => void }) {
  return (
    <Box position="absolute" top={8} left={8} right={8} display="flex" justifyContent="space-between" zIndex={1}>
      <IconButton aria-label="닫기" onClick={onClose} sx={{ color: '#fff' }}>
        <CloseIcon />
      </IconButton>
      {onDelete != null && (
        <PopMenu
          items={
            <PopMenu.Item color="error" icon={<DeleteOutlineIcon fontSize="small" />} onClick={onDelete}>
              삭제
            </PopMenu.Item>
          }
        >
          <IconButton aria-label="탑승권 메뉴" sx={{ color: '#fff' }}>
            <MoreVertIcon />
          </IconButton>
        </PopMenu>
      )}
    </Box>
  )
}

function TicketImage({ image }: { image: string }) {
  return (
    <Box display="flex" flex={1} minWidth={0} minHeight={0} alignItems="center" justifyContent="center" p={2}>
      <Box component="img" src={image} alt="탑승권" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 1 }} />
    </Box>
  )
}
