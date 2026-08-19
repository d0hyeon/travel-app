import { Button, Divider, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { isDev } from '~app/env'
import { IntroFullScreenBanner } from '~features/intro/IntroFullScreenBanner'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { signInWithEmail, signInWithKakao } from '@waylog/domains/auth'
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
  const isMobile = useIsMobile()
  const redirection = useAuthRedirection()

  return (
    <IntroFullScreenBanner>
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

      {isDev && (
        <>
          <Divider sx={{ width: 300, color: 'text.disabled', fontSize: 12 }}>dev only</Divider>
          <DevEmailLogin />
        </>
      )}
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
