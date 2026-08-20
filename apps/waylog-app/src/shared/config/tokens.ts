// 웹 shared/config/theme.ts 에서 순수 값만 추출한다.
// MUI 의 createTheme 결과는 웹 전용이므로 값만 승계한다.

export const palette = {
  primary: '#4C84FF',
  warning: '#d68d06',
  grey: '#787c7e',
  info: '#333',
  success: '#66BB6A',
  text: '#1a1a1a',
  textSecondary: '#787c7e',
  background: '#fff',
  divider: 'rgba(0,0,0,0.12)',
} as const

// 웹은 breakpoints.down('md') 에서 값이 줄어든다. 앱은 모바일이므로
// 그 축소된 값이 곧 앱의 값이다.
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
} as const

export const controlHeight = {
  sm: 24,
  md: 32,
  lg: 40,
} as const

export const fontSize = {
  h6: 16,
  subtitle2: 13,
  body1: 14,
  body2: 13,
  caption: 11,
} as const

// 웹 theme.ts 의 fontWeight: regular 700, medium 700, bold 900
export const fontWeight = {
  regular: '700',
  bold: '900',
} as const
