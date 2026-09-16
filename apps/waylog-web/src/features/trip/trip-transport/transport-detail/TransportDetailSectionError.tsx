import { Alert, AlertTitle, Button, Typography } from '@mui/material'

interface Props {
  message: string
  onRetry: () => void
}

export function TransportDetailSectionError({ message, onRetry }: Props) {
  return (
    <Alert
      color="error"
      action={
        <Button size="small" variant="contained" onClick={onRetry}>
          재시도
        </Button>
      }
    >
      <AlertTitle>에러가 발생했어요!</AlertTitle>
      <Typography variant="caption">{message}</Typography>
    </Alert>
  )
}
