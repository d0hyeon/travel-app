import { Box, Button, Container, Typography } from '@mui/material'
import { signInWithKakao } from './auth.api'

export default function LoginPage() {
  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100dvh"
        gap={4}
      >
        <Box textAlign="center">
          <Typography variant="h5" fontWeight="bold" mb={1}>
            여행 플래너
          </Typography>
          <Typography variant="body2" color="text.secondary">
            여행을 계획하고 함께 기록해요
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={signInWithKakao}
          sx={{
            backgroundColor: '#FEE500',
            color: '#000000',
            fontWeight: 'bold',
            width: 240,
            '&:hover': { backgroundColor: '#F0D900' },
          }}
        >
          카카오로 시작하기
        </Button>
      </Box>
    </Container>
  )
}
