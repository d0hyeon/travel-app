import type { ReactNode } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'
import { sxToStyle, type Sx } from './sx'

export interface StackProps extends ViewProps {
  sx?: Sx
  /** 웹 코드를 그대로 옮기기 위한 MUI 축약 prop */
  width?: number | string
  flex?: number
  flexWrap?: 'wrap' | 'nowrap'
  useFlexGap?: boolean
  minWidth?: number | string
  mb?: number
  mt?: number
  ml?: number
  mr?: number
  px?: number
  py?: number
  p?: number
  /** MUI 와 같이 1 = 8px 이다 */
  spacing?: number
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
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
  width,
  flex,
  flexWrap,
  useFlexGap: _useFlexGap,
  minWidth,
  mb,
  mt,
  ml,
  mr,
  px,
  py,
  p,
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
          width,
          flex,
          flexWrap,
          minWidth,
          marginBottom: mb != null ? mb * 8 : undefined,
          marginTop: mt != null ? mt * 8 : undefined,
          marginLeft: ml != null ? ml * 8 : undefined,
          marginRight: mr != null ? mr * 8 : undefined,
          paddingHorizontal: px != null ? px * 8 : undefined,
          paddingVertical: py != null ? py * 8 : undefined,
          padding: p != null ? p * 8 : undefined,
        } as ViewStyle,
        sxToStyle(sx),
        style,
      ]}
      {...rest}
    />
  )
}
