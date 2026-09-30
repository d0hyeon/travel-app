import { cancelSignUp, useSignUp } from '@waylog/domains/clients'
import { AppRoute } from '@waylog/routes'
import { useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Checkbox, Divider, Stack, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../shared/config/tokens'
import logoImage from '../../../assets/logo.png'
import { LegalDocumentModal } from './LegalDocumentModal'

const LOGO_SIZE = 72

const requiredAgreements = [
  { key: 'terms', label: '(필수) 이용약관 동의', documentPath: AppRoute.이용약관 },
  { key: 'privacy', label: '(필수) 개인정보 수집·이용 동의', documentPath: AppRoute.개인정보처리방침 },
  { key: 'age', label: '(필수) 만 14세 이상입니다' },
] as const

type AgreementKey = (typeof requiredAgreements)[number]['key']

const noneAgreed: Record<AgreementKey, boolean> = { terms: false, privacy: false, age: false }

export function SignUpConsentScreen() {
  const insets = useSafeAreaInsets()
  const signUp = useSignUp()
  const [agreed, setAgreed] = useState(noneAgreed)
  const [openedDocumentPath, setOpenedDocumentPath] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAllAgreed = requiredAgreements.every(({ key }) => agreed[key])
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
    } catch (e) {
      setError(e instanceof Error ? e.message : '가입 취소에 실패했습니다')
      setIsCancelling(false)
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
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
          <Checkbox checked={isAllAgreed} onChange={toggleAll} />
          <Typography variant="body1" fontWeight="bold">
            약관에 모두 동의합니다
          </Typography>
        </Pressable>
        <Divider />
        {requiredAgreements.map((agreement) => (
          <View key={agreement.key} style={styles.agreementRow}>
            <Pressable
              style={styles.row}
              onPress={() => setAgreed({ ...agreed, [agreement.key]: !agreed[agreement.key] })}
            >
              <Checkbox
                size="small"
                checked={agreed[agreement.key]}
                onChange={() => setAgreed({ ...agreed, [agreement.key]: !agreed[agreement.key] })}
              />
              <Typography variant="body2">{agreement.label}</Typography>
            </Pressable>
            {'documentPath' in agreement && (
              <Pressable onPress={() => setOpenedDocumentPath(agreement.documentPath)}>
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

        <Button
          variant="contained"
          size="large"
          disabled={!isAllAgreed || isBusy}
          onPress={() => void handleAgree()}
          style={styles.stretch}
        >
          동의하고 시작하기
        </Button>
        <Button variant="text" disabled={isBusy} onPress={() => void handleDecline()} style={styles.stretch}>
          동의하지 않음
        </Button>
      </Stack>

      <LegalDocumentModal path={openedDocumentPath} onClose={() => setOpenedDocumentPath(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: palette.background,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  banner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.primary,
  },
  logoImage: { width: '100%', height: '100%' },
  form: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  agreementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stretch: { alignSelf: 'stretch' },
})
