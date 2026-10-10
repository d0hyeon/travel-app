import CloseIcon from '@mui/icons-material/Close'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Typography } from '@mui/material'
import { signInWithEmail } from '@waylog/domains/clients'
import { useCallback, useState, type FormEvent } from 'react'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'
import { useOverlay } from '~shared/hooks/useOverlay'

const FORM_ID = 'email-sign-in-form'

export function useEmailSignInOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    overlay.open(({ isOpen, close }) => <EmailSignInDialog isOpen={isOpen} onClose={close} />)
  }, [overlay])

  return { open }
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

function EmailSignInDialog({ isOpen, onClose }: Props) {
  const isMobile = useIsMobile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const isSubmittable = email.trim() !== '' && password !== ''

  async function signIn(event: FormEvent) {
    event.preventDefault()
    if (!isSubmittable || isSigningIn) return

    setErrorMessage(undefined)
    setIsSigningIn(true)
    try {
      await signInWithEmail(email.trim(), password)
      onClose()
    } catch {
      setErrorMessage('로그인에 실패했어요. 이메일과 비밀번호를 확인해 주세요')
      setIsSigningIn(false)
    }
  }

  const form = (
    <Stack component="form" id={FORM_ID} onSubmit={signIn} gap={2} pt={1}>
      <TextField
        label="이메일"
        type="email"
        autoComplete="email"
        fullWidth
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        fullWidth
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {errorMessage != null && <Alert severity="error">{errorMessage}</Alert>}
    </Stack>
  )

  const submitButton = (
    <Button
      type="submit"
      form={FORM_ID}
      variant="contained"
      size="large"
      fullWidth={isMobile}
      loading={isSigningIn}
      disabled={!isSubmittable}
    >
      로그인
    </Button>
  )

  if (isMobile) {
    return (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        <Stack height="100%" overflow="hidden">
          <Stack direction="row" alignItems="center" justifyContent="space-between" p={2} flexShrink={0}>
            <Typography fontSize={17} fontWeight={700}>
              이메일로 로그인
            </Typography>
            <IconButton aria-label="닫기" onClick={onClose} disabled={isSigningIn}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack flex={1} minHeight={0} px={2} pb={2} sx={{ overflowY: 'auto' }}>
            {form}
          </Stack>
          <Stack p={2} flexShrink={0}>
            {submitButton}
          </Stack>
        </Stack>
      </FullScreenPopup>
    )
  }

  return (
    <Dialog open={isOpen} onClose={isSigningIn ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>이메일로 로그인</DialogTitle>
      <DialogContent>{form}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" disabled={isSigningIn} onClick={onClose}>
          취소
        </Button>
        {submitButton}
      </DialogActions>
    </Dialog>
  )
}
