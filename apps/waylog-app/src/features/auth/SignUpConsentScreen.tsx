import { cancelSignUp, useSignUp } from '@waylog/domains/clients'
import { REQUIRED_AGREEMENT_KEYS, type AgreementKey } from '@waylog/domains/modules/terms'
import { AppRoute } from '@waylog/routes'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Checkbox, Divider, Stack, Typography } from '~shared/components/design-system'
import { palette, radius } from '~shared/config/tokens'
import logoImage from '../../../assets/logo.png'
import { LegalDocumentModal } from './LegalDocumentModal'
import { BottomArea } from '~shared/components/BottomArea'

const LOGO_SIZE = 72

const agreementLabels: Record<AgreementKey, { label: string; documentPath?: string }> = {
  terms: { label: '(필수) 이용약관 동의', documentPath: AppRoute.이용약관 },
  privacy: { label: '(필수) 개인정보 수집·이용 동의', documentPath: AppRoute.개인정보처리방침 },
  age: { label: '(필수) 만 14세 이상입니다' },
}

const noneAgreed: Record<AgreementKey, boolean> = { terms: false, privacy: false, age: false }

export function SignUpConsentScreen() {
  const insets = useSafeAreaInsets()
  const signUp = useSignUp()
  const [agreed, setAgreed] = useState(noneAgreed)
  const [openedDocumentPath, setOpenedDocumentPath] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllAgreed = REQUIRED_AGREEMENT_KEYS.every((key) => agreed[key])
  const isBusy = signUp.isPending || isCancelling

  function toggleAll() {
    const next = !isAllAgreed
    setAgreed({ terms: next, privacy: next, age: next })
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
    <View style={[styles.container]}>
      <View style={styles.body}>
        <View style={styles.banner}>
          <View style={styles.logo}>
            <Image source={logoImage} style={styles.logoImage} />
          </View>
          <Typography variant="h5" fontWeight="bold">
            WayLog
          </Typography>
        </View>

        <Stack spacing={1.5} style={styles.form}>
          <Pressable style={styles.row} onPress={toggleAll}>
            <Checkbox checked={isAllAgreed} />
            <Typography variant="body1" fontWeight="bold">
              약관에 모두 동의합니다
            </Typography>
          </Pressable>
          <Divider />
          {REQUIRED_AGREEMENT_KEYS.map((key) => (
            <View key={key} style={styles.agreementRow}>
              <Pressable style={styles.row} onPress={() => setAgreed({ ...agreed, [key]: !agreed[key] })}>
                <Checkbox size="small" checked={agreed[key]} />
                <Typography variant="body2">{agreementLabels[key].label}</Typography>
              </Pressable>
              {agreementLabels[key].documentPath != null && (
                <Pressable onPress={() => setOpenedDocumentPath(agreementLabels[key].documentPath ?? null)}>
                  <Typography variant="caption" color="text.secondary">
                    보기
                  </Typography>
                </Pressable>
              )}
            </View>
          ))}

          {error != null && (
            <Typography variant="body2" color="error" textAlign="center">
              {error}
            </Typography>
          )}
        </Stack>
      </View>
      <BottomArea style={styles.footer}>
        <Button variant="outlined" size="large" disabled={isBusy} onPress={() => void handleDecline()} style={styles.stretch}>
          동의하지 않음
        </Button>
        <Button
          variant="contained"
          size="large"
          disabled={!isAllAgreed || isBusy}
          onPress={() => void handleAgree()}
          style={styles.stretch}
          fullWidth
        >
          동의하고 시작하기
        </Button>
      </BottomArea>
      <LegalDocumentModal path={openedDocumentPath} onClose={() => setOpenedDocumentPath(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: palette.background,

    paddingTop: 48,
  },
  body: { flex: 1, width: '100%', paddingHorizontal: 24 },
  banner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.primary,
  },
  logoImage: { width: '100%', height: '100%' },
  form: { alignSelf: 'stretch', justifyContent: 'flex-start', marginBottom: 50, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 8 },
  agreementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stretch: { alignSelf: 'stretch' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.divider,
  }
})
