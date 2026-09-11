import { signInWithEmail, signInWithKakao } from '@waylog/domains/clients'
import * as Linking from 'expo-linking'
import { useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import { Button, Divider, Stack, TextField, Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../shared/config/tokens'
import logoImage from '../../../assets/logo.png'

const LOGO_SIZE = 72
// 카카오 브랜드 가이드의 버튼 색과 라벨 색.
const KAKAO_BRAND_COLOR = '#FEE500'
const KAKAO_LABEL_COLOR = '#3C1E1E'

function KakaoSymbol() {
  return (
    <Svg width={18} height={17} viewBox="0 0 18 17" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 0C4.029 0 0 3.074 0 6.868c0 2.442 1.617 4.588 4.071 5.808l-1.04 3.78a.35.35 0 0 0 .518.385L8.42 14.02c.191.014.383.02.58.02 4.971 0 9-3.074 9-6.868S13.971 0 9 0z"
        fill={KAKAO_LABEL_COLOR}
      />
    </Svg>
  )
}

export function LoginScreen() {
  const insets = useSafeAreaInsets()
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleKakaoLogin() {
    setError(null)
    setIsPending(true)
    try {
      const isSignedIn = await signInWithKakao({ redirectTo: Linking.createURL('auth/callback') })
      // 성공하면 세션 변경이 이 화면을 곧바로 걷어낸다. 여기서 대기 상태를 풀면
      // 언마운트 직전에 버튼이 한 번 되살아난다. 취소는 화면이 그대로 남으므로 풀어준다.
      if (!isSignedIn) setIsPending(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다')
      setIsPending(false)
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.banner}>
        <View style={styles.logo}>
          <Image source={logoImage} style={styles.logoImage} />
        </View>
        <View style={styles.brand}>
          <Typography variant="h5" fontWeight="bold" mb={0.5}>
            WayLog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            여행을 계획하고 함께 기록해요
          </Typography>
        </View>
      </View>

      <Button
        variant="contained"
        size="large"
        disabled={isPending}
        startIcon={isPending ? <ActivityIndicator size="small" color={KAKAO_LABEL_COLOR} /> : <KakaoSymbol />}
        onPress={() => void handleKakaoLogin()}
        style={styles.kakaoButton}
        textStyle={styles.kakaoLabel}
      >
        카카오로 로그인
      </Button>

      {error != null && (
        <Typography variant="body2" color="error" textAlign="center">
          {error}
        </Typography>
      )}

      {__DEV__ && <DevEmailLogin />}
    </View>
  )
}

function DevEmailLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    try {
      await signInWithEmail(email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인 실패')
    }
  }

  return (
    <Stack spacing={1.5} style={styles.devSection}>
      <Divider />
      <Typography variant="caption" color="text.secondary" textAlign="center">
        dev only
      </Typography>
      <TextField
        label="이메일"
        fullWidth
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField label="비밀번호" fullWidth secureTextEntry value={password} onChangeText={setPassword} />
      {error != null && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}
      <Button variant="outlined" size="small" onPress={() => void handleSubmit()}>
        이메일로 로그인
      </Button>
    </Stack>
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
  // 심볼과 앱명이 남는 공간 한가운데 놓이고, 버튼은 아래로 밀린다.
  banner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.primary,
  },
  logoImage: { width: '100%', height: '100%' },
  brand: { alignItems: 'center' },
  // Button 의 fullWidth 는 flex:1 이라 세로 컨테이너에서는 높이까지 늘어난다. 가로만 채운다.
  kakaoButton: { alignSelf: 'stretch', backgroundColor: KAKAO_BRAND_COLOR },
  kakaoLabel: { color: KAKAO_LABEL_COLOR },
  devSection: { alignSelf: 'stretch', marginTop: 24 },
})
