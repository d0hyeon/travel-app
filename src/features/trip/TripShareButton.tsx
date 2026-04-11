import ShareIcon from '@mui/icons-material/Share'
import { IconButton, Snackbar, Tooltip } from '@mui/material'
import { useState } from 'react'
import { useTrip } from './useTrip'

interface Props {
  tripId: string
}

export function TripShareButton({ tripId }: Props) {
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
        <IconButton onClick={handleShare} size="small">
          <ShareIcon fontSize="small" />
        </IconButton>
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
