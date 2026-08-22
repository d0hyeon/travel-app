import { Stack, Typography, type StackProps } from '@mui/material'
import { useUnreadChatCount } from '@waylog/domains/modules/trip-chat'

interface Props extends StackProps {
  tripId: string
  variant?: 'fill' | 'outline'
}

export function TripUnreadCountBadge({ tripId, variant = 'fill', ...props }: Props) {
  const count = useUnreadChatCount(tripId)
  if (count === 0) return null

  const isFill = variant === 'fill'

  return (
    <Stack

      paddingX={1}
      paddingY={0.25}
      borderRadius={3}
      bgcolor={isFill ? 'primary.main' : 'white'}
      border={isFill ? 'none' : '1px solid'}
      borderColor={isFill ? undefined : 'primary.main'}
      alignItems="center"
      justifyContent="center"
      minWidth="24px"
      minHeight="24px"
      {...props}
    >
      <Typography
        sx={{ fontSize: 11, fontWeight: 700, color: isFill ? 'white' : 'primary.main', lineHeight: 1 }}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Stack>
  )
}
