import CloseIcon from '@mui/icons-material/Close'
import { Box, type BoxProps, IconButton, Stack, Typography, type TypographyProps } from '@mui/material'
import { type ReactNode } from 'react'

export interface NotificationCardProps extends BoxProps {
  variant?: 'shadow' | 'outline'
  leading?: ReactNode
  onClose?: () => void
  children?: ReactNode
}

function NotificationCard({
  variant = 'shadow',
  leading,
  onClose,
  children,
  sx,
  ...boxProps
}: NotificationCardProps) {
  return (
    <Box
      paddingY={1.75}
      paddingX={2}
      paddingRight={4}
      borderRadius={4}
      bgcolor="background.paper"
      alignItems="start"
      display="flex"
      sx={{
        ...(variant === 'shadow' && {
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
          border: 'none',
        }),
        ...(variant === 'outline' && {
          boxShadow: 'none',
          border: '1.5px solid',
          borderColor: 'divider',
        }),
        position: 'relative',
        ...sx,
      }}
      {...boxProps}
    >
      {leading && (
        <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', pt: 0.25 }}>
          {leading}
        </Box>
      )}

      <Stack flex={1} minWidth={0} pr={onClose ? 2.5 : 0}>
        {children}
      </Stack>

      {onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 20,
            height: 20,
            color: 'text.disabled',
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      )}
    </Box>
  )
}

function Title(props: TypographyProps) {
  return (
    <Typography
      variant="body2"
      fontWeight={900}
      lineHeight={1.3}
      color="text.primary"
      {...props}
    />

  )
}

function Text(props: TypographyProps) {
  return (
    <Typography
      variant="caption"
      color="text.secondary"
      lineHeight={1.5}
      mt={0.5}
      display="block"
      {...props}
    />

  )
}

NotificationCard.Title = Title
NotificationCard.Text = Text

export { NotificationCard }
