import { MaterialIcons } from '@expo/vector-icons'
import { type ReactNode } from 'react'
import { Box, IconButton, Stack, Typography } from '../mui'
import type { Sx, TypographyProps } from '../mui'
import { palette, radius } from '../../config/tokens'

export interface NotificationCardProps {
  variant?: 'shadow' | 'outline'
  leading?: ReactNode
  onClose?: () => void
  children?: ReactNode
  sx?: Sx
}

function NotificationCard({
  variant = 'shadow',
  leading,
  onClose,
  children,
  sx,
}: NotificationCardProps) {
  const isShadow = variant === 'shadow'

  return (
    <Box
      sx={{
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: radius.xl,
        backgroundColor: palette.background,
        alignItems: 'flex-start',
        flexDirection: 'row',
        position: 'relative',
        // RN 은 boxShadow 대신 elevation·shadow* 를 쓴다.
        ...(isShadow
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
            }),
        ...(sx ?? {}),
      }}
    >
      {leading && <Box sx={{ paddingTop: 2 }}>{leading}</Box>}

      <Stack sx={{ flex: 1 }}>{children}</Stack>

      {onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={18} color={palette.textSecondary} />
        </IconButton>
      )}
    </Box>
  )
}

function Title(props: TypographyProps) {
  return <Typography variant="body2" sx={{ marginBottom: 8 }} {...props} />
}

function Text(props: TypographyProps) {
  return <Typography variant="caption" color="text.secondary" sx={{ marginTop: 4 }} {...props} />
}

NotificationCard.Title = Title
NotificationCard.Text = Text

export { NotificationCard }
