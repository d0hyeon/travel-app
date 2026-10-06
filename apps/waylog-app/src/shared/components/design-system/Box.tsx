import type { ReactNode } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'

export interface BoxProps extends ViewProps {
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
      style={[{ width, height, flex, minWidth, position, alignItems: textAlign === 'center' ? 'center' : undefined } as ViewStyle, style]}
      {...rest}
    />
  )
}
