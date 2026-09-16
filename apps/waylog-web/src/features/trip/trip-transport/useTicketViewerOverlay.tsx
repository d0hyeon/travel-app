import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, IconButton } from '@mui/material'
import { useCallback } from 'react'
import { useOverlay } from '~shared/hooks/useOverlay'

// 탑승 시 즉시 열람이 목적이라 타이틀을 두지 않는다.
// 어두운 배경에 이미지만 남겨 밝기 조절 없이도 바코드가 읽히게 한다.
export function useTicketViewerOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (image: string) => {
      overlay.open(({ isOpen, close }) => (
        <TicketViewer image={image} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}

interface Props {
  image: string
  isOpen: boolean
  onClose: () => void
}

function TicketViewer({ image, isOpen, onClose }: Props) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: { sx: { bgcolor: 'rgba(0,0,0,0.94)' } } }}
    >
      <IconButton
        aria-label="닫기"
        onClick={onClose}
        sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>

      <Box display="flex" flex={1} alignItems="center" justifyContent="center" p={2}>
        <Box
          component="img"
          src={image}
          alt=""
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 1 }}
        />
      </Box>
    </Dialog>
  )
}
