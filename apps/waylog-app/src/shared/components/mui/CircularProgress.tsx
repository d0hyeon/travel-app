import { ActivityIndicator } from 'react-native'
import { palette } from '../../config/tokens'

export interface CircularProgressProps {
  size?: number
  color?: 'primary' | 'inherit'
}

export function CircularProgress({ size = 40, color = 'primary' }: CircularProgressProps) {
  return (
    <ActivityIndicator
      size={size <= 24 ? 'small' : 'large'}
      color={color === 'primary' ? palette.primary : palette.textSecondary}
    />
  )
}
