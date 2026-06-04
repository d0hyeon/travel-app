import ChatIcon from '@mui/icons-material/Chat'
import { Snackbar, SnackbarContent, Stack, Typography } from '@mui/material'

interface Props {
  open: boolean
  tripId: string
  message: string
  onOpen: (tripId: string) => void
  onClose: () => void
}

export function ChatToast({ open, tripId, message, onOpen, onClose }: Props) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={(_, reason) => {
        if (reason === 'escapeKeyDown') return
        onClose()
      }}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      onClick={() => {
        onOpen(tripId)
        onClose()
      }}
      sx={{ cursor: 'pointer' }}
    >
      <SnackbarContent
        message={
          <Stack direction="row" alignItems="center" gap={1}>
            <ChatIcon fontSize="small" />
            <Typography variant="body2">{message}</Typography>
          </Stack>
        }
      />
    </Snackbar>
  )
}
