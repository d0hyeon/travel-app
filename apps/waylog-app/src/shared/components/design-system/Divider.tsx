import { type StyleProp, type ViewStyle } from 'react-native'
import { palette } from '../../config/tokens'
import { Box } from './Box'

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  style?: StyleProp<ViewStyle>
}

export function Divider({ orientation = 'horizontal', style }: DividerProps) {
  const isVertical = orientation === 'vertical'

  return (
    <Box
      style={[
        {
          width: isVertical ? 1 : undefined,
          height: isVertical ? undefined : 1,
          alignSelf: isVertical ? 'stretch' : undefined,
          backgroundColor: palette.divider,
        },
        style,
      ]}
    />
  )
}
