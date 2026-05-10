import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'

export type PostFormStep = 'trip' | 'photo' | 'meta'

const STEP_ORDER: PostFormStep[] = ['trip', 'photo', 'meta']

const STEP_TITLE: Record<PostFormStep, string> = {
  trip: '여행 선택',
  photo: '이미지 선택',
  meta: '상세 설정',
}

interface Props {
  step: PostFormStep
}

export function PostFormStepHeader({ step }: Props) {
  const navigate = useNavigate()
  const stepIndex = STEP_ORDER.indexOf(step)

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={20}
      sx={{
        height: 64,
        px: 2,
        py: '14px',
        bgcolor: 'background.paper',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
      }}
    >
      <Stack direction="row" alignItems="center" gap={1} height="100%">
        <IconButton
          onClick={() => (window.history.length > 0 ? navigate(-1) : navigate('/'))}
          sx={{ width: 36, height: 36 }}
          aria-label="뒤로"
        >
          <ChevronLeftIcon sx={{ color: '#111', strokeWidth: 1.8 }} />
        </IconButton>

        <Box flex={1} minWidth={0}>
          <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: '#9b9ba3', mb: '2px' }}>
            새 포스트 · {stepIndex + 1}/{STEP_ORDER.length}
          </Typography>
          <Typography sx={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px', color: '#111' }}>
            {STEP_TITLE[step]}
          </Typography>
        </Box>

        <Stack direction="row" gap="4px" alignItems="center">
          {STEP_ORDER.map((s, idx) => {
            const isCurrent = idx === stepIndex
            const isDone = idx < stepIndex
            return (
              <Box
                key={s}
                sx={{
                  width: isCurrent ? 16 : 6,
                  height: 6,
                  borderRadius: '3px',
                  bgcolor: isCurrent || isDone ? 'primary.main' : 'rgba(0,0,0,0.12)',
                  transition: 'all .2s',
                }}
              />
            )
          })}
        </Stack>
      </Stack>
    </Box>
  )
}
