import { Button, Snackbar, Tooltip, type ButtonProps } from '@mui/material'
import { useState } from 'react'
import { useTrip } from './useTrip'

interface Props extends ButtonProps {
  tripId: string
}

export function TripInviteButton({ tripId, children = '초대하기', ...props }: Props) {
  const { data: trip } = useTrip(tripId)
  const [open, setOpen] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/trip/invite/${trip.shareLink}`

    if (navigator.share) {
      await navigator.share({ url })
    } else {
      await navigator.clipboard.writeText(url)
      setOpen(true)
    }
  }

  return (
    <>
      <Tooltip title="초대 링크 복사">
        <Button size="small" variant="contained" {...props} onClick={handleShare}>
          {children}
        </Button>

      </Tooltip>
      <Snackbar
        open={open}
        autoHideDuration={2000}
        onClose={() => setOpen(false)}
        message="초대 링크가 복사됐어요"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
