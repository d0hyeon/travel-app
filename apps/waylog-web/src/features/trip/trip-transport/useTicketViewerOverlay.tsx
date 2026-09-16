import CloseIcon from '@mui/icons-material/Close'
import { Box, Dialog, IconButton, MobileStepper } from '@mui/material'
import { useCallback, useState } from 'react'
import { useOverlay } from '~shared/hooks/useOverlay'

// 탑승 시 즉시 열람이 목적이라 타이틀을 두지 않는다.
// 어두운 배경에 이미지만 남겨 밝기 조절 없이도 바코드가 읽히게 한다.
export function useTicketViewerOverlay() {
  const overlay = useOverlay()

  const open = useCallback(
    (images: string[]) => {
      overlay.open(({ isOpen, close }) => (
        <TicketViewer images={images} isOpen={isOpen} onClose={close} />
      ))
    },
    [overlay],
  )

  return { open }
}

interface Props {
  images: string[]
  isOpen: boolean
  onClose: () => void
}

function TicketViewer({ images, isOpen, onClose }: Props) {
  const [index, setIndex] = useState(0)

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

      <Box
        display="flex"
        flex={1}
        alignItems="center"
        justifyContent="center"
        p={2}
        onClick={() => setIndex((prev) => (prev + 1) % images.length)}
        sx={{ cursor: images.length > 1 ? 'pointer' : 'default' }}
      >
        <Box
          component="img"
          src={images[index]}
          alt=""
          sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 1 }}
        />
      </Box>

      {images.length > 1 && (
        <MobileStepper
          variant="dots"
          steps={images.length}
          position="static"
          activeStep={index}
          backButton={null}
          nextButton={null}
          sx={{ bgcolor: 'transparent', justifyContent: 'center' }}
        />
      )}
    </Dialog>
  )
}
