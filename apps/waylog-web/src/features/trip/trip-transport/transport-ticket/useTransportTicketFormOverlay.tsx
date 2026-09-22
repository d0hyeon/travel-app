import CloseIcon from '@mui/icons-material/Close'
import { Alert, Button, Dialog, DialogActions, DialogContent, IconButton, Stack, Typography } from '@mui/material'
import type { TripTransportType } from '@waylog/domains/modules/trip-transport'
import { useCallback, useState } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'
import { TransportTicketForm } from './TransportTicketForm'
import type { TransportTicketDraft } from '../transport-form-funnel/transportForm.types'

interface OpenParams {
  tripId: string
  type: TripTransportType
  onSubmit: (tickets: TransportTicketDraft[]) => Promise<void>
}

// 상세의 티켓 추가는 업로드가 끝날 때까지 닫지 않아 실패를 바로 다시 시도할 수 있다.
export function useTransportTicketFormOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (params: OpenParams) => {
      overlay.open(({ isOpen, close }) => (
        <TransportTicketFormDialog isOpen={isOpen} onClose={close} {...params} />
      ))
    },
    [overlay],
  )

  return { open }
}

interface Props extends OpenParams {
  isOpen: boolean
  onClose: () => void
}

function TransportTicketFormDialog({ isOpen, onClose, tripId, type, onSubmit }: Props) {
  const isMobile = useIsMobile()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tickets, setTickets] = useState<TransportTicketDraft[]>([])

  const submit = async (tickets: TransportTicketDraft[]) => {
    setError(undefined)
    setIsSubmitting(true)
    try {
      await onSubmit(tickets)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '탑승권을 올리지 못했어요')
    } finally {
      setIsSubmitting(false)
    }
  }

  const form = (
    <>
      {error != null && <Alert severity="error">{error}</Alert>}
      <TransportTicketForm tripId={tripId} type={type} showIntro={false} onChange={setTickets} />
    </>
  )

  if (isMobile) {
    return (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        <Stack height="100%" overflow="hidden">
          <Stack direction="row" alignItems="center" justifyContent="space-between" p={2} flexShrink={0}>
            <Typography fontSize={17} fontWeight={700}>
              탑승권 추가
            </Typography>
            <IconButton aria-label="닫기" onClick={onClose} disabled={isSubmitting}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack flex={1} minHeight={0} px={2} pb={2} gap={2} sx={{ overflowY: 'auto' }}>
            {form}
          </Stack>
          <Stack p={2} flexShrink={0} sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <Button fullWidth variant="contained" loading={isSubmitting} onClick={() => submit(tickets)}>
              추가
            </Button>
          </Stack>
        </Stack>
      </FullScreenPopup>
    )
  }

  return (
    <Dialog open={isOpen} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogContent>{form}</DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={isSubmitting} onClick={onClose}>
          취소
        </Button>
        <Button variant="contained" loading={isSubmitting} onClick={() => submit(tickets)}>
          추가
        </Button>
      </DialogActions>
    </Dialog>
  )
}
