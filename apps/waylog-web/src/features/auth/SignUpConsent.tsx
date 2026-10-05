import { Button, Checkbox, Divider, FormControlLabel, Link, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { cancelSignUp, useSignUp } from '@waylog/domains/clients'
import { REQUIRED_AGREEMENT_KEYS, type AgreementKey } from '@waylog/domains/modules/terms'
import { AppRoute } from '@waylog/routes'
import { IntroFullScreenBanner } from '~features/intro/IntroFullScreenBanner'
import { useIsMobile } from '~shared/hooks/env/useIsMobile'

const agreementLabels: Record<AgreementKey, { label: string; href?: string }> = {
  terms: { label: '(필수) 이용약관 동의', href: AppRoute.이용약관 },
  privacy: { label: '(필수) 개인정보 수집·이용 동의', href: AppRoute.개인정보처리방침 },
  age: { label: '(필수) 만 14세 이상입니다' },
}

const noneAgreed: Record<AgreementKey, boolean> = { terms: false, privacy: false, age: false }

export function SignUpConsent() {
  const isMobile = useIsMobile()
  const signUp = useSignUp()
  const [agreed, setAgreed] = useState(noneAgreed)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllAgreed = REQUIRED_AGREEMENT_KEYS.every((key) => agreed[key])
  const isBusy = signUp.isPending || isCancelling

  function toggleAll(checked: boolean) {
    setAgreed({ terms: checked, privacy: checked, age: checked })
  }

  async function handleAgree() {
    setError(null)
    try {
      await signUp()
    } catch (e) {
      setError(e instanceof Error ? e.message : '가입에 실패했습니다')
    }
  }

  async function handleDecline() {
    setError(null)
    setIsCancelling(true)
    try {
      await cancelSignUp()
    } catch {
      setError('가입 취소에 실패했습니다. 잠시 후 다시 시도해주세요')
      setIsCancelling(false)
    }
  }

  return (
    <IntroFullScreenBanner>
      <Stack spacing={1} sx={{ width: isMobile ? '100%' : 300 }}>
        <FormControlLabel
          label={<Typography fontWeight={700}>약관에 모두 동의합니다</Typography>}
          control={<Checkbox checked={isAllAgreed} onChange={(e) => toggleAll(e.target.checked)} />}
        />
        <Divider />
        {REQUIRED_AGREEMENT_KEYS.map((key) => (
          <Stack key={key} direction="row" alignItems="center" justifyContent="space-between">
            <FormControlLabel
              label={<Typography variant="body2">{agreementLabels[key].label}</Typography>}
              control={
                <Checkbox
                  size="small"
                  checked={agreed[key]}
                  onChange={(e) => setAgreed({ ...agreed, [key]: e.target.checked })}
                />
              }
            />
            {agreementLabels[key].href != null && (
              <Link href={agreementLabels[key].href} target="_blank" rel="noopener" variant="caption" color="text.secondary">
                보기
              </Link>
            )}
          </Stack>
        ))}

        {error != null && (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        )}

        <Button variant="contained" size="large" disabled={!isAllAgreed || isBusy} onClick={() => void handleAgree()}>
          동의하고 시작하기
        </Button>
        <Button variant="text" color="inherit" disabled={isBusy} onClick={() => void handleDecline()}>
          동의하지 않음
        </Button>
      </Stack>
    </IntroFullScreenBanner>
  )
}
