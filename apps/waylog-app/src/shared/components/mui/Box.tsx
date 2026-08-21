import type { ReactNode } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { sxToStyle, type Sx } from './sx'

// 웹 코드를 그대로 붙여넣기 위해 MUI 와 같은 이름·prop 을 유지한다.
export interface BoxProps extends ViewProps {
  sx?: Sx
  /** MUI 축약 prop */
  width?: number | string
  height?: number | string
  flex?: number
  minWidth?: number | string
  overflow?: string
  position?: 'absolute' | 'relative'
  textAlign?: 'left' | 'center' | 'right'
  children?: ReactNode
}

export function Box({
  sx,
  style,
  width,
  height,
  flex,
  minWidth,
  overflow: _overflow,
  position,
  textAlign,
  ...rest
}: BoxProps) {
  return (
    <View
      style={[{ width, height, flex, minWidth, position, alignItems: textAlign === 'center' ? 'center' : undefined } as ViewStyle, sxToStyle(sx), style]}
      {...rest}
    />
  )
}
