import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { sxToStyle, type Sx } from './sx'

// 웹 코드를 그대로 붙여넣기 위해 MUI 와 같은 이름·prop 을 유지한다.
export interface BoxProps extends ViewProps {
  sx?: Sx
  children?: ReactNode
}

export function Box({ sx, style, ...rest }: BoxProps) {
  return <View style={[sxToStyle(sx), style]} {...rest} />
}
