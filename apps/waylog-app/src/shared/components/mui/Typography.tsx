import type { ReactNode } from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { palette } from '../../config/tokens'
import { sxToStyle, type Sx } from './sx'

// 웹 theme.ts 의 값을 그대로 옮긴다. 앱은 모바일이므로
// breakpoints.down('md') 쪽 수치를 쓴다.
const VARIANT_STYLE = {
  h4: { fontSize: 24, fontWeight: '900' },
  h5: { fontSize: 20, fontWeight: '900' },
  h6: { fontSize: 16, fontWeight: '900' },
  subtitle1: { fontSize: 14, fontWeight: '700' },
  subtitle2: { fontSize: 13, fontWeight: '700' },
  body1: { fontSize: 14, fontWeight: '700' },
  body2: { fontSize: 13, fontWeight: '700' },
  caption: { fontSize: 11, fontWeight: '700' },
} as const

export type TypographyVariant = keyof typeof VARIANT_STYLE

// MUI 의 color="text.secondary" 같은 표기를 그대로 받는다.
const COLOR_MAP: Record<string, string> = {
  'text.primary': palette.text,
  'text.secondary': palette.textSecondary,
  'primary.main': palette.primary,
  primary: palette.primary,
  error: '#d32f2f',
  warning: palette.warning,
  success: palette.success,
}

export interface TypographyProps extends RNTextProps {
  variant?: TypographyVariant
  color?: string
  fontWeight?: 'bold' | 'medium' | number | string
  /** 웹 코드를 그대로 옮기기 위해 받기만 하고 무시한다 */
  component?: string
  /** MUI 축약 prop */
  mb?: number
  mt?: number
  ml?: number
  mr?: number
  flexShrink?: number
  noWrap?: boolean
  textAlign?: 'left' | 'center' | 'right'
  py?: number
  px?: number
  sx?: Sx
  children?: ReactNode
}

export function Typography({
  variant = 'body1',
  color,
  fontWeight,
  component: _component,
  mb,
  mt,
  ml,
  mr,
  flexShrink,
  noWrap,
  textAlign,
  py,
  px,
  sx,
  style,
  ...rest
}: TypographyProps) {
  return (
    <RNText
      style={[
        VARIANT_STYLE[variant],
        { color: color != null ? (COLOR_MAP[color] ?? color) : palette.text },
        fontWeight != null && {
          fontWeight: (fontWeight === 'medium' ? '700' : String(fontWeight)) as never,
        },
        {
          marginBottom: mb != null ? mb * 8 : undefined,
          marginTop: mt != null ? mt * 8 : undefined,
          marginLeft: ml != null ? ml * 8 : undefined,
          marginRight: mr != null ? mr * 8 : undefined,
          flexShrink,
          textAlign,
          paddingVertical: py != null ? py * 8 : undefined,
          paddingHorizontal: px != null ? px * 8 : undefined,
        },
        sxToStyle(sx),
        style,
      ]}
      numberOfLines={noWrap === true ? 1 : rest.numberOfLines}
      {...rest}
    />
  )
}
