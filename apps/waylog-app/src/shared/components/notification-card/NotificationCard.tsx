import { MaterialIcons } from '@expo/vector-icons'
import { type ReactNode } from 'react'
import { Box, IconButton, Stack, Typography } from '~/shared/components/design-system'
import type { TypographyProps } from '~/shared/components/design-system'
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { palette, radius } from '../../config/tokens'

export interface NotificationCardProps {
  variant?: 'shadow' | 'outline'
  leading?: ReactNode
  onClose?: () => void
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

function NotificationCard({
  variant = 'shadow',
  leading,
  onClose,
  children,
  style,
}: NotificationCardProps) {
  const isShadow = variant === 'shadow'

  return (
    <Box
      style={[
        [styles.box2, { ...(isShadow
            ? {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            }
            : {
              borderWidth: 1.5,
              borderColor: palette.divider,
            }) }],
        style,
      ]}
    >
      {leading && <Box style={styles.box}>{leading}</Box>}

      <Stack style={styles.stack}>{children}</Stack>

      {onClose && (
        <IconButton
          size="small"
          onPress={onClose}
          style={styles.iconButton}
        >
          <MaterialIcons name="close" size={18} color={palette.textSecondary} />
        </IconButton>
      )}
    </Box>
  )
}

function Title(props: TypographyProps) {
  return <Typography variant="body2" style={styles.titleTypography} {...props} />
}

function Text(props: TypographyProps) {
  return <Typography variant="caption" color="text.secondary" style={styles.textTypography} {...props} />
}

NotificationCard.Title = Title
NotificationCard.Text = Text

export { NotificationCard }

const styles = StyleSheet.create({
  box: {
    paddingTop: 2,
  },
  stack: {
    flex: 1,
  },
  iconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  titleTypography: {
    marginBottom: 8,
  },
  textTypography: {
    marginTop: 4,
  },

  box2: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: radius.xl,
    backgroundColor: palette.background,
    alignItems: 'flex-start',
    flexDirection: 'row',
    position: 'relative',
  },
})
