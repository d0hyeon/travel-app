import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { sxToStyle, type Sx } from './sx'

export interface StackProps extends ViewProps {
  sx?: Sx
  /** MUI 와 같이 1 = 8px 이다 */
  spacing?: number
  direction?: 'row' | 'column'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly'
  gap?: number
  children?: ReactNode
}

export function Stack({
  sx,
  style,
  spacing,
  direction = 'column',
  alignItems,
  justifyContent,
  gap,
  ...rest
}: StackProps) {
  return (
    <View
      style={[
        {
          flexDirection: direction,
          alignItems,
          justifyContent,
          gap: gap != null ? gap * 8 : spacing != null ? spacing * 8 : undefined,
        },
        sxToStyle(sx),
        style,
      ]}
      {...rest}
    />
  )
}
