import { Button, Container, Divider, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { isDev } from '~app/env'
import { IntroFullScreenBanner } from '~features/intro/IntroFullScreenBanner'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { signInWithApple, signInWithEmail, signInWithKakao } from '@waylog/domains/clients'
import { useAuthRedirection } from './AuthNavigate'

const KAKAO_BRAND_COLOR = '#FEE500'
const KAKAO_LABEL_COLOR = '#3C1E1E'

function KakaoSymbol() {
  return (
    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.029 0 0 3.074 0 6.868c0 2.442 1.617 4.588 4.071 5.808l-1.04 3.78a.35.35 0 0 0 .518.385L8.42 14.02c.191.014.383.02.58.02 4.971 0 9-3.074 9-6.868S13.971 0 9 0z"
        // fill="#3C1E1E"
        fill={KAKAO_LABEL_COLOR}
      />
    </svg>
  )
}

function AppleSymbol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
    </svg>
  )
}

export default function LoginPage() {
  const isMobile = useIsMobile()
  const redirection = useAuthRedirection()

  return (
    <IntroFullScreenBanner>
      <Container maxWidth="sm">
        <Stack gap={1} width="100%">
          <Button
            onClick={() => signInWithKakao({ redirectTo: redirection })}
            startIcon={<KakaoSymbol />}
            variant="contained"
            color="info"

            size="large"
            sx={{ minWidth: 300, backgroundColor: KAKAO_BRAND_COLOR, color: KAKAO_LABEL_COLOR }}
          >
            카카오로 로그인
          </Button>
          <Button
            onClick={() => signInWithApple({ redirectTo: redirection })}
            startIcon={<AppleSymbol />}
            variant="contained"

            size="large"
            sx={{ minWidth: 300, bgcolor: '#000', color: '#fff', '&:hover': { bgcolor: '#000' } }}
          >
            Apple로 로그인
          </Button>
        </Stack>


        {isDev && (
          <>
            <Divider sx={{ width: 300, color: 'text.disabled', fontSize: 12 }}>dev only</Divider>
            <DevEmailLogin />
          </>
        )}
      </Container>
    </IntroFullScreenBanner>
  )
}

function DevEmailLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 실패')
    }
  }

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={1.5} sx={{ width: 300 }}>
      <TextField
        size="small"
        label="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
      />
      <TextField
        size="small"
        label="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        error={!!error}
        helperText={error ?? undefined}
      />
      <Button type="submit" variant="outlined" size="small">
        이메일로 로그인
      </Button>
    </Stack>
  )
}
