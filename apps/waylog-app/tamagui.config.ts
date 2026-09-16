import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui } from 'tamagui'
import { palette } from './src/shared/config/tokens'

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
    danger: palette.error,
  },
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
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
