import type { ReactNode } from 'react'
import { StyleSheet, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { palette } from '../../config/tokens'
import { LoadableImage } from '../LoadableImage'
import { Box } from './Box'
import { Typography } from './Typography'

const DEFAULT_SIZE = 40

export interface AvatarProps {
  src?: string
  /** 이미지가 없을 때 보여줄 대체 내용. 보통 이름 첫 글자다. */
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export function Avatar({ src, children, style }: AvatarProps) {
  const flatStyle = (StyleSheet.flatten(style) ?? {}) as ViewStyle & TextStyle
  const size = typeof flatStyle.width === 'number' ? flatStyle.width : DEFAULT_SIZE

  const initial = (
    <Typography
      style={[styles.typography, { fontSize: typeof flatStyle.fontSize === 'number' ? flatStyle.fontSize : size / 2 }]}
    >
      {children}
    </Typography>
  )

  return (
    <Box
      style={[
        [styles.box, { width: size, height: size, borderRadius: size / 2 }],
        style,
      ]}
    >
      {src ? (
        <LoadableImage
          source={{ uri: src }}
          style={{ width: size, height: size }}
          resizeMode="cover"
          fallback={initial}
        />
      ) : (
        initial
      )}
    </Box>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  typography: {
    color: palette.textSecondary,
  },
})
