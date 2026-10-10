import { MaterialIcons } from '@expo/vector-icons'
import { signInWithEmail } from '@waylog/domains/clients'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, IconButton, TextField, Typography } from '~shared/components/design-system'
import { FullScreenPopup } from '~shared/components/FullScreenPopup'
import { KeyboardDismissArea } from '~shared/components/KeyboardDismissArea'
import { palette } from '~shared/config/tokens'
import { useKeyboardMetrics } from '~shared/hooks/env/useKeyboardMetrics'
import { useOverlay } from '~shared/hooks/useOverlay'

export function useEmailSignInOverlay() {
  const overlay = useOverlay()

  const open = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <KeyboardDismissArea>
        <FullScreenPopup isOpen={isOpen} onClose={close}>
          <EmailSignInPanel onClose={close} />
        </FullScreenPopup>
      </KeyboardDismissArea>
    ))
  }, [overlay])

  return { open }
}

interface PanelProps {
  onClose: () => void
}

function EmailSignInPanel({ onClose }: PanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const insets = useSafeAreaInsets()
  const { metrics: keyboard } = useKeyboardMetrics()
  const bottomInset = keyboard == null ? insets.bottom : keyboard.height

  const isSubmittable = email.trim() !== '' && password !== ''

  async function signIn() {
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

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <Typography style={styles.title}>이메일로 로그인</Typography>
        <IconButton disabled={isSigningIn} onPress={onClose} accessibilityLabel="닫기">
          <MaterialIcons name="close" size={20} color={palette.text} />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <TextField
          label="이메일"
          fullWidth
          autoFocus
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="비밀번호"
          fullWidth
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="done"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={() => isSubmittable && void signIn()}
        />
        {errorMessage != null && (
          <Typography color="error" style={styles.errorText}>
            {errorMessage}
          </Typography>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 16 }]}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          loading={isSigningIn}
          disabled={!isSubmittable}
          onPress={() => void signIn()}
        >
          로그인
        </Button>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 16, fontWeight: '700' },
  body: { padding: 16, gap: 16 },
  errorText: { fontSize: 13 },
  footer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
})
