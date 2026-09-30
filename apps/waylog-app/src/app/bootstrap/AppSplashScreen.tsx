import * as SplashScreen from 'expo-splash-screen'
import { Image, StyleSheet, View } from 'react-native'
import { Typography } from '~/shared/components/design-system'
import { palette, radius } from '../../shared/config/tokens'
import logoImage from '../../../assets/logo.png'

const LOGO_SIZE = 72

/** 네이티브 스플래시(app.config.ts 의 expo-splash-screen 설정)와 같은 배경색을 써서 전환 시 깜빡임을 없앤다. */
export function AppSplashScreen() {
  return (
    <View style={styles.container} onLayout={() => SplashScreen.hideAsync()}>
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: palette.background,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: palette.primary,
  },
  logoImage: { width: '100%', height: '100%' },
  brand: { alignItems: 'center' },
})
