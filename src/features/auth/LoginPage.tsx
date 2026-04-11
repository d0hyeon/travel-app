import LuggageIcon from '@mui/icons-material/Luggage'
import { Box, Button, Typography } from '@mui/material'
import { signInWithKakao } from './auth.api'

export default function LoginPage() {
  return (
    <Box
      sx={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          p: 5,
          borderRadius: 4,
          bgcolor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)',
          width: 300,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LuggageIcon sx={{ fontSize: 32, color: 'white' }} />
        </Box>

        <Box textAlign="center">
          <Typography variant="h5" fontWeight={600} mb={0.5} color="white">
            여행 플래너
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            여행을 계획하고 함께 기록해요
          </Typography>
        </Box>

        <Button
          variant="contained"
          fullWidth
          onClick={signInWithKakao}
          sx={{
            bgcolor: '#FEE500',
            color: '#3C1E1E',
            fontWeight: 500,
            height: 48,
            borderRadius: 100,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#F0D900', boxShadow: 'none' },
          }}
        >
          카카오로 시작하기
        </Button>
      </Box>
    </Box>
  )
}
