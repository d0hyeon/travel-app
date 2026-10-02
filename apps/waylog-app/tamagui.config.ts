import { defaultConfig } from '@tamagui/config/v5'
import { createFont, createTamagui } from 'tamagui'
import { palette } from './src/shared/config/tokens'

// RN 커스텀 폰트는 fontWeight 를 무시하므로 weight 별로 다른 SUIT family 를 지정한다.
// Typography.tsx 의 resolveFontFamily 와 같은 굵기 구간을 쓴다.
const suitFace = {
  normal: { normal: 'SUIT' },
  600: { normal: 'SUIT-Bold' },
  700: { normal: 'SUIT-Bold' },
  800: { normal: 'SUIT-Heavy' },
  900: { normal: 'SUIT-Heavy' },
}

const suitFont = createFont({
  ...defaultConfig.fonts.body,
  family: 'SUIT',
  face: suitFace,
})

const suitHeadingFont = createFont({
  ...defaultConfig.fonts.heading,
  family: 'SUIT',
  face: suitFace,
})

export const appThemes = {
  light: {
    ...defaultConfig.themes.light,
    background: palette.background,
    color: palette.text,
    colorHover: palette.textSecondary,
    surface: palette.background,
    onSurface: palette.text,
    onSurfaceMuted: palette.textSecondary,
    primary: palette.primary,
    onPrimary: '#fff',
    danger: palette.error,
    glass: 'rgba(255,255,255,0.3)',
  },
  dark: {
    ...defaultConfig.themes.dark,
    background: '#2b2b2b',
    color: '#fff',
    colorHover: '#c4c4c4',
    surface: '#2b2b2b',
    onSurface: '#fff',
    onSurfaceMuted: '#c4c4c4',
    primary: palette.primary,
    onPrimary: '#fff',
    danger: '#ff8a8a',
    glass: 'rgba(66,66,66,0.85)',
  },
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: suitFont,
    heading: suitHeadingFont,
  },
  themes: {
    ...defaultConfig.themes,
    ...appThemes,
  },
})

export default tamaguiConfig

type AppTamaguiConfig = typeof tamaguiConfig

declare module 'tamagui' {
  // Tamagui가 설정 타입을 선언 병합으로 읽는다.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppTamaguiConfig {}
}
