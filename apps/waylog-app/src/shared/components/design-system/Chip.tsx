import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { palette } from '../../config/tokens'
import { Box } from './Box'
import { Typography } from './Typography'

export interface ChipProps {
  label: string
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
  color?: 'primary' | 'default'
  onPress?: () => void
  onDelete?: () => void
  style?: StyleProp<ViewStyle>
}

export function Chip({
  label,
  size = 'medium',
  variant = 'filled',
  color = 'default',
  onPress,
  onDelete,
  style,
}: ChipProps) {
  const isPrimary = color === 'primary'
  const filled = variant === 'filled'

  return (
    <Pressable onPress={onPress}>
      <Box
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: size === 'small' ? 8 : 12,
            paddingVertical: size === 'small' ? 3 : 6,
            borderRadius: 12,
            borderWidth: filled ? 0 : 1,
            borderColor: isPrimary ? palette.primary : palette.divider,
            backgroundColor: filled
              ? isPrimary
                ? palette.primary
                : 'rgba(0,0,0,0.08)'
              : 'transparent',
            alignSelf: 'flex-start',
          },
          style,
        ]}
      >
        <Typography
          style={{
            fontSize: size === 'small' ? 11 : 13,
            color: filled && isPrimary ? '#fff' : palette.text,
          }}
        >
          {label}
        </Typography>
        {onDelete != null && (
          <Pressable onPress={onDelete} hitSlop={8}>
            <MaterialIcons
              name="close"
              size={14}
              color={filled && isPrimary ? '#fff' : palette.textSecondary}
            />
          </Pressable>
        )}
      </Box>
    </Pressable>
  )
}
