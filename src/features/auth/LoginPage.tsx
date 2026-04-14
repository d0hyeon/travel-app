import LuggageIcon from '@mui/icons-material/Luggage'
import { Box, Button, Typography } from '@mui/material'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { signInWithKakao } from './auth.api'
import { useAuthRedirection } from './AuthNavigate'

function KakaoSymbol() {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.029 0 0 3.074 0 6.868c0 2.442 1.617 4.588 4.071 5.808l-1.04 3.78a.35.35 0 0 0 .518.385L8.42 14.02c.191.014.383.02.58.02 4.971 0 9-3.074 9-6.868S13.971 0 9 0z"
        // fill="#3C1E1E"
        fill="#fff"
      />
    </svg>
  )
}

export default function LoginPage() {
  const isMobile = useIsMobile();
  const redirection = useAuthRedirection();

  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        px: 3,
        pt: 6,
        pb: `calc(24px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* 심볼 + 앱명 */}
      <Box flex={1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: 4,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LuggageIcon sx={{ fontSize: 36, color: 'white' }} />
        </Box>
        <Box textAlign="center">
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            여행 플래너
          </Typography>
          <Typography variant="body2" color="text.secondary">
            여행을 계획하고 함께 기록해요
          </Typography>
        </Box>
      </Box>

      {/* 카카오 로그인 버튼 */}
      <Button
        onClick={() => signInWithKakao({ redirectTo: redirection })}
        startIcon={<KakaoSymbol />}
        variant="contained"
        color="info"
        fullWidth={isMobile}
        size="large"
        sx={{ minWidth: 300 }}
      >
        카카오로 로그인
      </Button>
    </Box>
  )
}
