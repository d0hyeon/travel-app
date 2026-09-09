import { Children, isValidElement, type ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { palette, radius } from '../../config/tokens'
import { Box } from './Box'
import { Typography } from './Typography'

export interface ToggleButtonProps {
  value: string
  children?: ReactNode
}

// 실제 렌더는 ToggleButtonGroup 이 한다. MUI 처럼 선언만 받는다.
export function ToggleButton(_props: ToggleButtonProps) {
  return null
}

export interface ToggleButtonGroupProps {
  value: string
  /** MUI 와 같은 시그니처. 같은 값을 다시 누르면 null 이 온다. */
  onChange: (event: unknown, value: string | null) => void
  exclusive?: boolean
  size?: 'small' | 'medium'
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export function ToggleButtonGroup({ value, onChange, children, style }: ToggleButtonGroupProps) {
  const buttons = Children.toArray(children)
    .filter(isValidElement<ToggleButtonProps>)
    .map((child) => child.props)

  return (
    <Box
      style={[
        {
          flexDirection: 'row',
          backgroundColor: 'rgba(0,0,0,0.08)',
          padding: 2,
          borderRadius: radius.md,
        },
        style,
      ]}
    >
      {buttons.map((button) => {
        const isSelected = button.value === value

        return (
          <Pressable
            key={button.value}
            onPress={() => onChange(null, isSelected ? null : button.value)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.sm + 2,
              backgroundColor: isSelected ? '#fff' : 'transparent',
            }}
          >
            <Typography
              style={{
                fontSize: 11,
                color: isSelected ? palette.text : palette.textSecondary,
              }}
            >
              {button.children}
            </Typography>
          </Pressable>
        )
      })}
    </Box>
  )
}
